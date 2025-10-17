"""
Tregu OMS (Advanced, Original Code)
- Products listing/search
- Simple cart/session-less quote endpoint
- Create orders with items
- Transition orders through statuses (new -> paid -> picking -> packed -> shipped -> delivered/cancelled)
- Multitenant via tenant_id

DROP-IN:
  - Place at: tregu_backend/app/modules/oms_adv.py
  - Wire in main.py:
      from app.modules.oms_adv import router as oms_router
      app.include_router(oms_router)
"""

from __future__ import annotations
import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, conint
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine

# Session dependency (reuses your project if available, else fallback)
try:
    from ..db import get_session  # type: ignore
    HAVE_APP_DB = True
except Exception:
    HAVE_APP_DB = False

from .ai_sql_models import (
    Product,
    Order,
    OrderItem,
)

SessionLocal = None
if not HAVE_APP_DB:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is required for OMS when ..db.get_session is unavailable")
    engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def _fallback_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def session_dep():
    return (get_session() if HAVE_APP_DB else _fallback_session())

router = APIRouter(prefix="/oms", tags=["oms"])

# ---------------- Pydantic ----------------
class ProductOut(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    description: str
    price_cents: int
    active: bool

class ProductIn(BaseModel):
    tenant_id: uuid.UUID
    seller_id: uuid.UUID
    sku: str
    name: str
    description: str = ""
    price_cents: conint(ge=0) = 0
    active: bool = True

class OrderItemIn(BaseModel):
    sku: str
    qty: conint(gt=0)
    price_cents: conint(ge=0)

class OrderCreateIn(BaseModel):
    tenant_id: uuid.UUID
    buyer_id: uuid.UUID
    items: List[OrderItemIn]

class OrderOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    buyer_id: uuid.UUID
    status: str
    total_cents: int

# ---------------- Products ----------------
@router.get("/products", response_model=List[ProductOut])
def list_products(
    tenant_id: uuid.UUID,
    q: Optional[str] = None,
    active: Optional[bool] = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(session_dep)
):
    stmt = select(Product).where(Product.tenant_id == tenant_id)
    if active is not None:
        stmt = stmt.where(Product.active == active)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Product.sku.ilike(like), Product.name.ilike(like), Product.description.ilike(like)))
    stmt = stmt.order_by(Product.name).offset((page-1)*page_size).limit(page_size)
    rows = db.execute(stmt).scalars().all()
    return [ProductOut(
        id=r.id, sku=r.sku, name=r.name, description=r.description, price_cents=r.price_cents, active=r.active
    ) for r in rows]

@router.post("/products", response_model=ProductOut)
def create_product(payload: ProductIn, db: Session = Depends(session_dep)):
    p = Product(
        tenant_id=payload.tenant_id,
        seller_id=payload.seller_id,
        sku=payload.sku,
        name=payload.name,
        description=payload.description,
        price_cents=payload.price_cents,
        active=payload.active,
    )
    db.add(p); db.commit(); db.refresh(p)
    return ProductOut(
        id=p.id, sku=p.sku, name=p.name, description=p.description, price_cents=p.price_cents, active=p.active
    )

# ---------------- Carts/Quote (sessionless) ----------------
class QuoteLine(BaseModel):
    sku: str
    qty: conint(gt=0)

class QuoteIn(BaseModel):
    tenant_id: uuid.UUID
    items: List[QuoteLine]

class QuoteOut(BaseModel):
    total_cents: int
    lines: List[dict]

@router.post("/quote", response_model=QuoteOut)
def quote(payload: QuoteIn, db: Session = Depends(session_dep)):
    total = 0
    details = []
    sku_to_qty = {line.sku: line.qty for line in payload.items}
    stmt = select(Product).where(Product.tenant_id == payload.tenant_id, Product.sku.in_(list(sku_to_qty.keys())))
    products = {p.sku: p for p in db.execute(stmt).scalars().all()}
    for sku, qty in sku_to_qty.items():
        p = products.get(sku)
        if not p:
            details.append({"sku": sku, "qty": qty, "price_cents": 0, "missing": True})
            continue
        line_total = qty * p.price_cents
        total += line_total
        details.append({"sku": sku, "qty": qty, "price_cents": p.price_cents, "line_total": line_total})
    return QuoteOut(total_cents=total, lines=details)

# ---------------- Orders ----------------
@router.post("/orders", response_model=OrderOut)
def create_order(payload: OrderCreateIn, db: Session = Depends(session_dep)):
    # Total
    total = 0
    for it in payload.items:
        total += it.price_cents * it.qty

    o = Order(tenant_id=payload.tenant_id, buyer_id=payload.buyer_id, status="new", total_cents=total)
    db.add(o); db.flush()

    for it in payload.items:
        db.add(OrderItem(order_id=o.id, sku=it.sku, qty=it.qty, price_cents=it.price_cents))

    db.commit(); db.refresh(o)
    return OrderOut(id=o.id, tenant_id=o.tenant_id, buyer_id=o.buyer_id, status=o.status, total_cents=o.total_cents)

@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: uuid.UUID, db: Session = Depends(session_dep)):
    o = db.get(Order, order_id)
    if not o:
        raise HTTPException(404, "order not found")
    return OrderOut(id=o.id, tenant_id=o.tenant_id, buyer_id=o.buyer_id, status=o.status, total_cents=o.total_cents)

class OrderStatusIn(BaseModel):
    status: str  # 'paid','picking','packed','shipped','delivered','cancelled'

@router.post("/orders/{order_id}/status", response_model=OrderOut)
def set_order_status(order_id: uuid.UUID, payload: OrderStatusIn, db: Session = Depends(session_dep)):
    o = db.get(Order, order_id)
    if not o:
        raise HTTPException(404, "order not found")
    allowed = {"new","paid","picking","packed","shipped","delivered","cancelled"}
    if payload.status not in allowed:
        raise HTTPException(400, "invalid status")
    o.status = payload.status
    db.commit(); db.refresh(o)
    return OrderOut(id=o.id, tenant_id=o.tenant_id, buyer_id=o.buyer_id, status=o.status, total_cents=o.total_cents)
