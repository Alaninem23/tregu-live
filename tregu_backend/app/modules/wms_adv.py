"""
Tregu WMS (Advanced, Buyer-Friendly) — Original Code
- Built on your SQLAlchemy models in ai_sql_models.py
- No third-party AI, no OpenAI usage
- Clear endpoints for receiving, reserving, releasing, shipping, adjusting
- Buyer-friendly availability & catalog views
- Multitenant by tenant_id
- Safe stock updates via StockMove + apply_stock_move (already in schema)

DROP-IN:
  - Place this file at: tregu_backend/app/modules/wms_adv.py
  - Include router in your FastAPI app (e.g., in main.py):
      from app.modules.wms_adv import router as wms_router
      app.include_router(wms_router)

CONFIG:
  - DATABASE_URL (PostgreSQL) must be set if you don't already have a Session dependency.
"""

from __future__ import annotations
import os
import uuid
from typing import List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, conint, validator

# Try to use your project's session dependency. If not present, we create one.
try:
    # If you already have a shared Session provider, use it.
    from ..db import get_session  # type: ignore
    HAVE_APP_DB = True
except Exception:
    HAVE_APP_DB = False

from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine

# Import your existing models & helpers
from .ai_sql_models import (
    Stock,
    StockMove,
    Warehouse,
    Order,
    OrderItem,
    Shipment,
    TrackingEvent,
    Carrier,
    apply_stock_move,
)

# -------------------------------------------------------------------
# Session fallback (only used if you don't have ..db.get_session)
# -------------------------------------------------------------------
SessionLocal: Optional[sessionmaker] = None
if not HAVE_APP_DB:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is required (env var) when ..db.get_session is not available."
        )
    engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def _fallback_session():
    if SessionLocal is None:
        raise RuntimeError("SessionLocal was not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def session_dep():
    return (get_session() if HAVE_APP_DB else _fallback_session())

# -------------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------------

class WarehouseOut(BaseModel):
    id: uuid.UUID
    code: str
    name: str

class InventoryRow(BaseModel):
    sku: str
    on_hand: int
    reserved: int
    available: int
    warehouse_id: uuid.UUID

class ReceiveIn(BaseModel):
    tenant_id: uuid.UUID
    warehouse_id: uuid.UUID
    sku: str = Field(..., min_length=1)
    qty: conint(strict=True, gt=0)  # > 0
    ref_type: str = "PO"
    ref_id: Optional[uuid.UUID] = None

class ReserveLine(BaseModel):
    sku: str
    qty: conint(strict=True, gt=0)

class ReserveIn(BaseModel):
    tenant_id: uuid.UUID
    warehouse_id: uuid.UUID
    order_id: uuid.UUID
    lines: List[ReserveLine]

class ReleaseIn(BaseModel):
    tenant_id: uuid.UUID
    warehouse_id: uuid.UUID
    order_id: uuid.UUID
    lines: List[ReserveLine]

class ShipIn(BaseModel):
    tenant_id: uuid.UUID
    warehouse_id: uuid.UUID
    order_id: uuid.UUID
    carrier_code: Optional[str] = None   # If provided, creates/links a Carrier row
    tracking_number: Optional[str] = None

class AdjustIn(BaseModel):
    tenant_id: uuid.UUID
    warehouse_id: uuid.UUID
    sku: str
    delta: int  # positive or negative
    reason: str = "adjustment"

class MoveIn(BaseModel):
    tenant_id: uuid.UUID
    from_warehouse_id: uuid.UUID
    to_warehouse_id: uuid.UUID
    sku: str
    qty: conint(strict=True, gt=0)
    reason: str = "relocation"

class CatalogRow(BaseModel):
    sku: str
    total_on_hand: int
    total_reserved: int
    total_available: int

class OrderTrackEvent(BaseModel):
    message: str
    location: Optional[str] = None
    created_at: str

class OrderTracking(BaseModel):
    order_id: uuid.UUID
    shipments: List[Dict]

# -------------------------------------------------------------------
# Router
# -------------------------------------------------------------------
router = APIRouter(prefix="/wms", tags=["wms"])

# -----------------------
# Utility functions
# -----------------------
def _sum_row_to_inventory(row) -> InventoryRow:
    return InventoryRow(
        sku=row.sku,
        on_hand=row.on_hand or 0,
        reserved=row.reserved or 0,
        available=(row.on_hand or 0) - (row.reserved or 0),
        warehouse_id=row.warehouse_id,
    )

def _get_or_create_carrier(db: Session, tenant_id: uuid.UUID, code: str) -> uuid.UUID:
    c = db.execute(
        select(Carrier).where(and_(Carrier.tenant_id == tenant_id, Carrier.code == code))
    ).scalar_one_or_none()
    if c:
        return c.id
    c = Carrier(tenant_id=tenant_id, code=code, name=code.upper(), service_levels="ground,2-day,overnight")
    db.add(c)
    db.flush()
    return c.id

# -------------------------------------------------------------------
# Warehouses
# -------------------------------------------------------------------
@router.get("/warehouses", response_model=List[WarehouseOut])
def list_warehouses(tenant_id: uuid.UUID, db: Session = Depends(session_dep)):
    rows = db.execute(
        select(Warehouse.id, Warehouse.code, Warehouse.name).where(Warehouse.tenant_id == tenant_id)
    ).all()
    return [WarehouseOut(id=r.id, code=r.code, name=r.name) for r in rows]

# -------------------------------------------------------------------
# Inventory Views (by warehouse), with paging & filtering
# -------------------------------------------------------------------
@router.get("/inventory", response_model=List[InventoryRow])
def inventory_by_warehouse(
    tenant_id: uuid.UUID,
    warehouse_id: Optional[uuid.UUID] = None,
    sku: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(session_dep),
):
    q = select(
        Stock.warehouse_id,
        Stock.sku,
        func.sum(Stock.on_hand).label("on_hand"),
        func.sum(Stock.reserved).label("reserved"),
    ).where(Stock.tenant_id == tenant_id)

    if warehouse_id:
        q = q.where(Stock.warehouse_id == warehouse_id)
    if sku:
        q = q.where(Stock.sku.ilike(f"%{sku}%"))

    q = q.group_by(Stock.warehouse_id, Stock.sku).order_by(Stock.sku)
    q = q.offset((page - 1) * page_size).limit(page_size)

    rows = db.execute(q).all()
    return [_sum_row_to_inventory(r) for r in rows]

# -------------------------------------------------------------------
# Receiving
# -------------------------------------------------------------------
@router.post("/receive")
def receive_stock(payload: ReceiveIn, db: Session = Depends(session_dep)):
    mv = StockMove(
        tenant_id=payload.tenant_id,
        warehouse_id=payload.warehouse_id,
        sku=payload.sku,
        qty=payload.qty,
        kind="receipt",
        ref_type=payload.ref_type,
        ref_id=payload.ref_id,
    )
    db.add(mv)
    db.flush()
    apply_stock_move(db, mv)
    db.commit()
    return {"ok": True, "move_id": str(mv.id)}

# -------------------------------------------------------------------
# Reserve / Release
# -------------------------------------------------------------------
@router.post("/reserve")
def reserve_stock(payload: ReserveIn, db: Session = Depends(session_dep)):
    # Ensure order exists (optional but helpful)
    order = db.get(Order, payload.order_id)
    if not order or order.tenant_id != payload.tenant_id:
        raise HTTPException(404, "order not found for tenant")

    for line in payload.lines:
        mv = StockMove(
            tenant_id=payload.tenant_id,
            warehouse_id=payload.warehouse_id,
            sku=line.sku,
            qty=line.qty,
            kind="reserve",
            ref_type="ORDER",
            ref_id=payload.order_id,
        )
        db.add(mv)
        db.flush()
        apply_stock_move(db, mv)

    if order.status in ("new", "paid"):
        order.status = "picking"

    db.commit()
    return {"ok": True}

@router.post("/release")
def release_reservation(payload: ReleaseIn, db: Session = Depends(session_dep)):
    # Not strictly linking to prior reserve moves; we just balance reserved down.
    for line in payload.lines:
        mv = StockMove(
            tenant_id=payload.tenant_id,
            warehouse_id=payload.warehouse_id,
            sku=line.sku,
            qty=line.qty,
            kind="release",
            ref_type="ORDER",
            ref_id=payload.order_id,
        )
        db.add(mv)
        db.flush()
        apply_stock_move(db, mv)

    db.commit()
    return {"ok": True}

# -------------------------------------------------------------------
# Shipping
# -------------------------------------------------------------------
@router.post("/ship")
def ship_order(payload: ShipIn, db: Session = Depends(session_dep)):
    order = db.get(Order, payload.order_id)
    if not order or order.tenant_id != payload.tenant_id:
        raise HTTPException(404, "order not found for tenant")

    # Deduct stock for each order item
    items = db.execute(select(OrderItem).where(OrderItem.order_id == payload.order_id)).scalars().all()
    for it in items:
        mv = StockMove(
            tenant_id=payload.tenant_id,
            warehouse_id=payload.warehouse_id,
            sku=it.sku,
            qty=it.qty,
            kind="ship",
            ref_type="ORDER",
            ref_id=payload.order_id,
        )
        db.add(mv)
        db.flush()
        apply_stock_move(db, mv)

    # Optional carrier
    carrier_id = None
    if payload.carrier_code:
        carrier_id = _get_or_create_carrier(db, payload.tenant_id, payload.carrier_code)

    # Create shipment shell
    sh = Shipment(
        tenant_id=payload.tenant_id,
        order_id=payload.order_id,
        carrier_id=carrier_id if carrier_id else uuid.uuid4(),  # ensure not null
        tracking_number=payload.tracking_number,
        status="created",
    )
    db.add(sh)

    order.status = "shipped"
    db.commit()

    return {"ok": True, "shipment_id": str(sh.id)}

# -------------------------------------------------------------------
# Adjustments
# -------------------------------------------------------------------
@router.post("/adjust")
def adjust_stock(payload: AdjustIn, db: Session = Depends(session_dep)):
    if payload.delta == 0:
        raise HTTPException(400, "delta cannot be 0")

    mv = StockMove(
        tenant_id=payload.tenant_id,
        warehouse_id=payload.warehouse_id,
        sku=payload.sku,
        qty=payload.delta,  # positive or negative
        kind="adjust",
        ref_type="ADJUST",
        ref_id=None,
    )
    db.add(mv)
    db.flush()
    apply_stock_move(db, mv)
    db.commit()
    return {"ok": True, "move_id": str(mv.id)}

# -------------------------------------------------------------------
# Move between warehouses (simple relocation)
# -------------------------------------------------------------------
@router.post("/move")
def move_between_warehouses(payload: MoveIn, db: Session = Depends(session_dep)):
    if payload.from_warehouse_id == payload.to_warehouse_id:
        raise HTTPException(400, "from and to warehouses must differ")

    # Ship out of the origin (deducts on_hand/reserved as needed)
    out_mv = StockMove(
        tenant_id=payload.tenant_id,
        warehouse_id=payload.from_warehouse_id,
        sku=payload.sku,
        qty=payload.qty,
        kind="ship",
        ref_type="MOVE",
        ref_id=None,
    )
    db.add(out_mv)
    db.flush()
    apply_stock_move(db, out_mv)

    # Receive into the destination
    in_mv = StockMove(
        tenant_id=payload.tenant_id,
        warehouse_id=payload.to_warehouse_id,
        sku=payload.sku,
        qty=payload.qty,
        kind="receipt",
        ref_type="MOVE",
        ref_id=None,
    )
    db.add(in_mv)
    db.flush()
    apply_stock_move(db, in_mv)

    db.commit()
    return {"ok": True, "out_move_id": str(out_mv.id), "in_move_id": str(in_mv.id)}

# -------------------------------------------------------------------
# Buyer-friendly catalog & availability
# -------------------------------------------------------------------
@router.get("/catalog", response_model=List[CatalogRow])
def catalog(tenant_id: uuid.UUID, sku: Optional[str] = None, db: Session = Depends(session_dep)):
    q = select(
        Stock.sku,
        func.sum(Stock.on_hand).label("oh"),
        func.sum(Stock.reserved).label("rv"),
    ).where(Stock.tenant_id == tenant_id)

    if sku:
        q = q.where(Stock.sku.ilike(f"%{sku}%"))

    q = q.group_by(Stock.sku).order_by(Stock.sku)
    rows = db.execute(q).all()

    out: List[CatalogRow] = []
    for r in rows:
        oh = int(r.oh or 0)
        rv = int(r.rv or 0)
        out.append(CatalogRow(
            sku=r.sku,
            total_on_hand=oh,
            total_reserved=rv,
            total_available=oh - rv
        ))
    return out

@router.get("/availability")
def availability(
    tenant_id: uuid.UUID,
    sku: str,
    warehouse_id: Optional[uuid.UUID] = None,
    db: Session = Depends(session_dep),
):
    q = select(func.sum(Stock.on_hand).label("oh"), func.sum(Stock.reserved).label("rv")).where(
        and_(Stock.tenant_id == tenant_id, Stock.sku == sku)
    )
    if warehouse_id:
        q = q.where(Stock.warehouse_id == warehouse_id)

    res = db.execute(q).first()
    oh = int((res.oh or 0)) if res is not None else 0
    rv = int((res.rv or 0)) if res is not None else 0

    return {"sku": sku, "on_hand": oh, "reserved": rv, "available": oh - rv}

# -------------------------------------------------------------------
# Order tracking (uses shipments & tracking_events if available)
# -------------------------------------------------------------------
@router.get("/orders/{order_id}/track", response_model=OrderTracking)
def order_tracking(order_id: uuid.UUID, db: Session = Depends(session_dep)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "order not found")

    ships = db.execute(select(Shipment).where(Shipment.order_id == order_id)).scalars().all()
    bundles = []
    for sh in ships:
        evs = db.execute(
            select(TrackingEvent).where(TrackingEvent.shipment_id == sh.id).order_by(TrackingEvent.created_at)
        ).scalars().all()
        bundles.append({
            "shipment_id": str(sh.id),
            "carrier_id": str(sh.carrier_id),
            "tracking_number": sh.tracking_number,
            "status": sh.status,
            "events": [
                {
                    "message": e.message,
                    "location": e.location,
                    "created_at": e.created_at.isoformat() if e.created_at else None
                }
                for e in evs
            ]
        })

    return OrderTracking(order_id=order_id, shipments=bundles)

# -------------------------------------------------------------------
# Minimal plugin hook so your AI (your own code) can call summaries
# -------------------------------------------------------------------
def summarize_inventory(tenant: str, db: Session) -> dict:
    row = db.execute(
        select(
            func.count(func.distinct(Stock.sku)),
            func.sum(Stock.on_hand),
            func.sum(Stock.reserved),
        ).where(Stock.tenant_id == uuid.UUID(tenant))
    ).first()
    if not row:
        return {"tenant": tenant, "sku_count": 0, "on_hand_total": 0, "reserved_total": 0, "available_total": 0}
    sku_count = int(row[0] or 0)
    on_hand_total = int(row[1] or 0)
    reserved_total = int(row[2] or 0)
    return {
        "tenant": tenant,
        "sku_count": sku_count,
        "on_hand_total": on_hand_total,
        "reserved_total": reserved_total,
        "available_total": on_hand_total - reserved_total,
    }

# If you have a plugin registry in your project, you can register this:
try:
    from ..core.plugins import register  # type: ignore
    def _summarize_inventory_wrapper(tenant: str) -> dict:
        with (SessionLocal() if SessionLocal else None) as db_ctx:  # fallback if no app db
            if db_ctx:
                return summarize_inventory(tenant, db_ctx)
            # If app has get_session, open a one-shot session
            db = next(get_session())
            try:
                return summarize_inventory(tenant, db)
            finally:
                db.close()
    register("wms.summarize_inventory", _summarize_inventory_wrapper)
except Exception:
    # plugin system not present; safely ignore
    pass
