"""
Tregu TMS (Advanced, Original Code)
- Manage carriers
- Create shipments & add tracking events
- Lookup shipments by order
- Simple label stub endpoint (replace with your real labeler later)

DROP-IN:
  - Place at: tregu_backend/app/modules/tms_adv.py
  - Wire in main.py:
      from app.modules.tms_adv import router as tms_router
      app.include_router(tms_router)
"""

from __future__ import annotations
import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, and_
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine

try:
    from ..db import get_session  # type: ignore
    HAVE_APP_DB = True
except Exception:
    HAVE_APP_DB = False

from .ai_sql_models import Carrier, Shipment, TrackingEvent

SessionLocal = None
if not HAVE_APP_DB:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL required for TMS when ..db.get_session unavailable")
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

router = APIRouter(prefix="/tms", tags=["tms"])

# ---------- Schemas ----------
class CarrierIn(BaseModel):
    tenant_id: uuid.UUID
    code: str
    name: str

class CarrierOut(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    service_levels: str

class ShipmentIn(BaseModel):
    tenant_id: uuid.UUID
    order_id: uuid.UUID
    carrier_id: uuid.UUID
    tracking_number: Optional[str] = None

class ShipmentOut(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    carrier_id: uuid.UUID
    tracking_number: Optional[str]
    status: str

class TrackingIn(BaseModel):
    tenant_id: uuid.UUID
    shipment_id: uuid.UUID
    message: str
    location: Optional[str] = None

# ---------- Carriers ----------
@router.post("/carriers", response_model=CarrierOut)
def create_carrier(payload: CarrierIn, db: Session = Depends(session_dep)):
    c = Carrier(tenant_id=payload.tenant_id, code=payload.code, name=payload.name, service_levels="ground,2-day,overnight")
    db.add(c); db.commit(); db.refresh(c)
    return CarrierOut(id=c.id, code=c.code, name=c.name, service_levels=c.service_levels)

@router.get("/carriers", response_model=List[CarrierOut])
def list_carriers(tenant_id: uuid.UUID, db: Session = Depends(session_dep)):
    rows = db.execute(select(Carrier).where(Carrier.tenant_id == tenant_id)).scalars().all()
    return [CarrierOut(id=r.id, code=r.code, name=r.name, service_levels=r.service_levels) for r in rows]

# ---------- Shipments ----------
@router.post("/shipments", response_model=ShipmentOut)
def create_shipment(payload: ShipmentIn, db: Session = Depends(session_dep)):
    sh = Shipment(
        tenant_id=payload.tenant_id,
        order_id=payload.order_id,
        carrier_id=payload.carrier_id,
        tracking_number=payload.tracking_number,
        status="created",
    )
    db.add(sh); db.commit(); db.refresh(sh)
    return ShipmentOut(id=sh.id, order_id=sh.order_id, carrier_id=sh.carrier_id, tracking_number=sh.tracking_number, status=sh.status)

@router.get("/shipments/by-order/{order_id}", response_model=List[ShipmentOut])
def shipments_for_order(order_id: uuid.UUID, db: Session = Depends(session_dep)):
    rows = db.execute(select(Shipment).where(Shipment.order_id == order_id)).scalars().all()
    return [ShipmentOut(id=s.id, order_id=s.order_id, carrier_id=s.carrier_id, tracking_number=s.tracking_number, status=s.status) for s in rows]

# ---------- Tracking ----------
@router.post("/tracking")
def add_tracking(payload: TrackingIn, db: Session = Depends(session_dep)):
    # ensure shipment belongs to same tenant
    sh = db.get(Shipment, payload.shipment_id)
    if not sh or sh.tenant_id != payload.tenant_id:
        raise HTTPException(404, "shipment not found for tenant")
    ev = TrackingEvent(
        tenant_id=payload.tenant_id,
        shipment_id=payload.shipment_id,
        message=payload.message,
        location=payload.location,
    )
    db.add(ev); db.commit()
    return {"ok": True}

# ---------- Labels (stub you can replace with your carrier gateway) ----------
class LabelIn(BaseModel):
    tenant_id: uuid.UUID
    shipment_id: uuid.UUID
    service_level: str = "ground"

@router.post("/labels")
def create_label(payload: LabelIn, db: Session = Depends(session_dep)):
    # This is a stub. Integrate your carrier API here and store label URLs/bytes.
    sh = db.get(Shipment, payload.shipment_id)
    if not sh or sh.tenant_id != payload.tenant_id:
        raise HTTPException(404, "shipment not found for tenant")
    # pretend label created:
    return {"ok": True, "label_url": f"https://labels.tregu.example/{sh.id}.pdf", "service_level": payload.service_level}
