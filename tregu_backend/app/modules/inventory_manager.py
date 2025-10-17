"""
Tregu Inventory Manager (Original Code)
- Aggregate inventory by tenant/warehouse
- Lookup a single SKU position
- Apply on-hand adjustments (positive/negative) with audit fields
- Low-stock report
- Simple cycle-count scaffolding using Task model (status flow handled in WCS/WES)

REQUIRES:
  - ai_sql_models: Stock, StockMove, Warehouse, Product, Task, apply_stock_move
  - DATABASE_URL or your project-wide get_session() dependency

DROP-IN:
  - Save as: tregu_backend/app/modules/inventory_manager.py
  - Wire in main.py:
      from app.modules.inventory_manager import router as inventory_router
      app.include_router(inventory_router)
"""

from __future__ import annotations
import os
import uuid
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, conint
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine

# Try to reuse your project's DB session dependency
try:
    from ..db import get_session  # type: ignore
    HAVE_APP_DB = True
except Exception:
    HAVE_APP_DB = False

from .ai_sql_models import (
    Stock, StockMove, Warehouse, Product, Task,
    apply_stock_move
)

# Fallback local session if project dep not present
SessionLocal = None
if not HAVE_APP_DB:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is required (or provide ..db.get_session)")
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

router = APIRouter(prefix="/inventory", tags=["inventory"])

# ---------------- Pydantic models ----------------

class StockRow(BaseModel):
    warehouse_id: uuid.UUID
    warehouse_code: str
    sku: str
    on_hand: int
    reserved: int
    available: int

class AggregateOut(BaseModel):
    tenant_id: uuid.UUID
    rows: List[StockRow]
    total_skus: int
    total_on_hand: int
    total_reserved: int
    total_available: int

class AdjustIn(BaseModel):
    tenant_id: uuid.UUID
    warehouse_id: uuid.UUID
    sku: str
    delta: int                      # +/- adjustment
    reason: Optional[str] = None    # free text reason (audit)

class AdjustOut(BaseModel):
    ok: bool
    warehouse_id: uuid.UUID
    sku: str
    on_hand: int
    reserved: int
    available: int

class SkuOut(BaseModel):
    tenant_id: uuid.UUID
    sku: str
    positions: List[StockRow]

class LowStockItem(BaseModel):
    sku: str
    available: int

class LowStockOut(BaseModel):
    tenant_id: uuid.UUID
    threshold: int
    items: List[LowStockItem]

class CycleCountIn(BaseModel):
    tenant_id: uuid.UUID
    warehouse_id: uuid.UUID
    skus: Optional[List[str]] = None   # if None, create generic count task
    assignee: Optional[str] = None

class CycleCountOut(BaseModel):
    created_task_ids: List[uuid.UUID]

# ---------------- Endpoints ----------------

@router.get("/aggregate", response_model=AggregateOut)
def aggregate_inventory(
    tenant_id: uuid.UUID,
    warehouse_id: Optional[uuid.UUID] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(200, ge=1, le=1000),
    db: Session = Depends(session_dep)
):
    """
    Returns paged, joined inventory rows (stock + warehouse code) with totals.
    Optional search q matches SKU or product name/desc.
    """
    # Base stock query
    st = select(
        Stock.tenant_id, Stock.warehouse_id, Stock.sku,
        Stock.on_hand, Stock.reserved
    ).where(Stock.tenant_id == tenant_id)

    if warehouse_id:
        st = st.where(Stock.warehouse_id == warehouse_id)

    # If search, join products via sku to filter
    if q:
        like = f"%{q}%"
        prod_stmt = select(Product.sku).where(
            and_(Product.tenant_id == tenant_id,
                 or_(Product.sku.ilike(like), Product.name.ilike(like), Product.description.ilike(like)))
        )
        skus = [r[0] for r in db.execute(prod_stmt).all()]
        if not skus:
            return AggregateOut(
                tenant_id=tenant_id, rows=[], total_skus=0,
                total_on_hand=0, total_reserved=0, total_available=0
            )
        st = st.where(Stock.sku.in_(skus))

    st = st.order_by(Stock.sku).offset((page-1)*page_size).limit(page_size)
    stock_rows = db.execute(st).all()

    # Map warehouse codes
    wh_codes: Dict[uuid.UUID, str] = {}
    if stock_rows:
        wh_ids = list({r.warehouse_id for r in [s[0] for s in stock_rows]})
        for w in db.execute(select(Warehouse).where(Warehouse.id.in_(wh_ids))).scalars().all():
            wh_codes[w.id] = w.code

    rows: List[StockRow] = []
    tot_on = tot_res = 0
    for rec in stock_rows:
        s = rec[0]
        avail = s.on_hand - s.reserved
        rows.append(StockRow(
            warehouse_id=s.warehouse_id,
            warehouse_code=wh_codes.get(s.warehouse_id, ""),
            sku=s.sku,
            on_hand=s.on_hand,
            reserved=s.reserved,
            available=avail
        ))
        tot_on += s.on_hand
        tot_res += s.reserved

    return AggregateOut(
        tenant_id=tenant_id,
        rows=rows,
        total_skus=len(rows),
        total_on_hand=tot_on,
        total_reserved=tot_res,
        total_available=tot_on - tot_res
    )


@router.get("/sku/{sku}", response_model=SkuOut)
def sku_position(
    sku: str,
    tenant_id: uuid.UUID,
    db: Session = Depends(session_dep)
):
    """
    Returns all warehouse positions for a single SKU.
    """
    st = select(Stock, Warehouse.code).join(Warehouse, Warehouse.id == Stock.warehouse_id)\
        .where(and_(Stock.tenant_id == tenant_id, Stock.sku == sku))
    rows = db.execute(st).all()
    out: List[StockRow] = []
    for s, code in rows:
        out.append(StockRow(
            warehouse_id=s.warehouse_id,
            warehouse_code=code,
            sku=s.sku,
            on_hand=s.on_hand,
            reserved=s.reserved,
            available=s.on_hand - s.reserved
        ))
    return SkuOut(tenant_id=tenant_id, sku=sku, positions=out)


@router.post("/adjust", response_model=AdjustOut)
def adjust_on_hand(payload: AdjustIn, db: Session = Depends(session_dep)):
    """
    Applies an 'adjust' StockMove with +/- delta and updates balances.
    """
    if payload.delta == 0:
        raise HTTPException(400, "delta cannot be 0")

    mv = StockMove(
        tenant_id=payload.tenant_id,
        warehouse_id=payload.warehouse_id,
        sku=payload.sku,
        qty=payload.delta,  # positive or negative
        kind="adjust",
        ref_type="ADJUST",
        ref_id=None
    )
    db.add(mv)
    db.flush()
    apply_stock_move(db, mv)

    # Optionally record a reason using Task (audit stub)
    if payload.reason:
        t = Task(
            tenant_id=payload.tenant_id,
            kind="adjust_audit",
            order_id=None,
            status="done",
            assignee=payload.reason[:120]
        )
        db.add(t)

    db.commit()

    # Return updated position
    s = db.execute(select(Stock).where(and_(
        Stock.tenant_id == payload.tenant_id,
        Stock.warehouse_id == payload.warehouse_id,
        Stock.sku == payload.sku
    ))).scalars().first()
    if not s:
        # Should not happen because _ensure_stock_row creates row before update
        raise HTTPException(500, "adjust applied but stock row missing")

    return AdjustOut(
        ok=True,
        warehouse_id=s.warehouse_id,
        sku=s.sku,
        on_hand=s.on_hand,
        reserved=s.reserved,
        available=s.on_hand - s.reserved
    )


@router.get("/low-stock", response_model=LowStockOut)
def low_stock(
    tenant_id: uuid.UUID,
    threshold: int = Query(0, ge=0),
    db: Session = Depends(session_dep)
):
    """
    Returns SKUs whose available < threshold.
    """
    st = select(Stock.sku, (Stock.on_hand - Stock.reserved).label("available"))\
         .where(Stock.tenant_id == tenant_id)
    items: List[LowStockItem] = []
    for sku, avail in db.execute(st):
        if avail < threshold:
            items.append(LowStockItem(sku=sku, available=int(avail)))
    # Sort ascending by availability
    items.sort(key=lambda x: x.available)
    return LowStockOut(tenant_id=tenant_id, threshold=threshold, items=items)


@router.post("/cycle-count", response_model=CycleCountOut)
def create_cycle_count(payload: CycleCountIn, db: Session = Depends(session_dep)):
    """
    Creates count tasks for a warehouse. If SKUs provided, one task per SKU; else one generic task.
    """
    created: List[uuid.UUID] = []
    if payload.skus:
        for sku in payload.skus:
            t = Task(
                tenant_id=payload.tenant_id,
                kind=f"cycle_count:{sku}",
                order_id=None,
                status="queued",
                assignee=payload.assignee
            )
            db.add(t); db.flush()
            created.append(t.id)
    else:
        t = Task(
            tenant_id=payload.tenant_id,
            kind=f"cycle_count:*",
            order_id=None,
            status="queued",
            assignee=payload.assignee
        )
        db.add(t); db.flush()
        created.append(t.id)
    db.commit()
    return CycleCountOut(created_task_ids=created)
