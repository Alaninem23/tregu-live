# tregu_backend/app/modules/ai_sql_router.py
from __future__ import annotations
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine

# --- Try to reuse your project's DB session/engine; fall back to env URL ---
try:
    # Your project usually exposes these
    from ..db import SessionLocal, engine  # type: ignore
except Exception:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://tregu:tregu@db:5432/tregu")
    engine = create_engine(DATABASE_URL, future=True)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

# --- Import your models and helpers ---
from .ai_sql_models import (
    Base,
    init_db_schema,
    seed_minimal_demo,
    assign_account_number_once,
    UserAccountNumber,
    Order,
    Shipment,
    Carrier,
    reserve_stock_for_order,
    ship_order,
)

router = APIRouter(prefix="/ai-sql", tags=["ai-sql"])

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -----------------------------
# Pydantic request/response DTOs
# -----------------------------
class SeedResponse(BaseModel):
    tenant_id: uuid.UUID
    admin_id: uuid.UUID
    warehouse_id: uuid.UUID

class ReserveReq(BaseModel):
    warehouse_id: uuid.UUID = Field(..., description="Warehouse to reserve from")

class ShipReq(BaseModel):
    warehouse_id: uuid.UUID
    carrier_id: uuid.UUID
    tracking: Optional[str] = None
    shipment_id: Optional[uuid.UUID] = None  # optional external id

class AssignResp(BaseModel):
    user_id: uuid.UUID
    account_number: Optional[str] = None     # present only if reveal=true
    masked: str

# -----------------------------
# Utilities
# -----------------------------
def _mask_9(n: str) -> str:
    """Return masked 9-digit account (*******123)."""
    n = (n or "").strip()
    if len(n) != 9 or not n.isdigit():
        return "*********"
    return "*******" + n[-2:] if False else "******" + n[-3:]  # keep last 3 by default

# -----------------------------
# Endpoints
# -----------------------------
@router.post("/init", summary="Create schema/tables/views if missing")
def init_schema():
    init_db_schema(engine)
    return {"ok": True}

@router.post("/seed", response_model=SeedResponse, summary="Seed minimal demo tenant/user/warehouse")
def seed_demo(db: Session = Depends(get_db)):
    t_id, u_id, w_id = seed_minimal_demo(db)
    return SeedResponse(tenant_id=t_id, admin_id=u_id, warehouse_id=w_id)

@router.post("/users/{user_id}/assign-account", response_model=AssignResp, summary="Assign 9-digit account number once")
def assign_account(user_id: uuid.UUID, reveal: bool = Query(False), db: Session = Depends(get_db)):
    # Will return existing if already assigned
    number = assign_account_number_once(db, user_id)
    db.commit()
    return AssignResp(
        user_id=user_id,
        account_number=number if reveal else None,
        masked=_mask_9(number),
    )

@router.get("/users/{user_id}/account", response_model=AssignResp, summary="Get masked (or full) account number")
def get_account(user_id: uuid.UUID, reveal: bool = Query(False), db: Session = Depends(get_db)):
    rec = db.get(UserAccountNumber, user_id)
    if not rec:
        # Nothing yet — be explicit
        raise HTTPException(404, "No account number assigned for this user")
    return AssignResp(
        user_id=user_id,
        account_number=rec.account_number if reveal else None,
        masked=_mask_9(rec.account_number),
    )

@router.post("/orders/{order_id}/reserve", summary="Reserve stock for order items, set status=picking")
def reserve_order(order_id: uuid.UUID, body: ReserveReq, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    reserve_stock_for_order(db, order_id, body.warehouse_id)
    db.commit()
    return {"ok": True, "order_id": str(order_id), "status": "picking"}

@router.post("/orders/{order_id}/ship", summary="Ship order (deduct stock, create shipment shell, status=shipped)")
def ship_order_api(order_id: uuid.UUID, body: ShipReq, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    # ensure carrier exists (simple existence check)
    carrier = db.get(Carrier, body.carrier_id)
    if not carrier:
        raise HTTPException(400, "Carrier not found")

    ship_order(
        db,
        order_id=order_id,
        warehouse_id=body.warehouse_id,
        shipment_id=body.shipment_id,
        carrier_id=body.carrier_id,
        tracking=body.tracking,
    )
    db.commit()
    return {
        "ok": True,
        "order_id": str(order_id),
        "shipment_id": str(body.shipment_id) if body.shipment_id else None,
        "status": "shipped",
    }
