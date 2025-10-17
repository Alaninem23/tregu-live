# tregu_backend/app/modules/ops_readonly.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List, Dict, Optional
from ..db import get_db  # your existing session dependency
from .ai_sql_models import (
    Tenant, User, Product, Supplier, PurchaseOrder, POItem,
    Warehouse, Stock, StockMove, Order, OrderItem,
    Carrier, Shipment, TrackingEvent, Task, Wave, WaveTask,
    assign_account_number_once, create_wave_for_order
)
import uuid
from sqlalchemy import select

router = APIRouter(prefix="/ops", tags=["ops-readonly"])

# ---------- READ LIST ENDPOINTS (visualization feeds) ----------

@router.get("/oms/orders")
def list_orders(db: Session = Depends(get_db)):
    q = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(50)
        .all()
    )
    out = []
    for o in q:
        out.append({
            "id": str(o.id),
            "tenant_id": str(o.tenant_id),
            "buyer_id": str(o.buyer_id),
            "status": o.status,
            "total_cents": o.total_cents,
            "created_at": o.created_at.isoformat() if o.created_at else None
        })
    return {"orders": out}

@router.get("/oms/order-items/{order_id}")
def list_order_items(order_id: str, db: Session = Depends(get_db)):
    oid = uuid.UUID(order_id)
    items = db.query(OrderItem).filter(OrderItem.order_id==oid).all()
    return {"items": [
        {"id": str(i.id), "sku": i.sku, "qty": i.qty, "price_cents": i.price_cents}
        for i in items
    ]}

@router.get("/scm/suppliers")
def list_suppliers(db: Session = Depends(get_db)):
    qs = db.query(Supplier).order_by(Supplier.name.asc()).limit(50).all()
    return {"suppliers":[
        {"id": str(s.id), "code": s.code, "name": s.name, "email": s.email, "phone": s.phone}
        for s in qs
    ]}

@router.get("/wms/stock")
def list_stock(db: Session = Depends(get_db)):
    qs = db.query(Stock).limit(100).all()
    return {"stock":[
        {"id": str(s.id), "tenant_id": str(s.tenant_id), "warehouse_id": str(s.warehouse_id),
         "sku": s.sku, "on_hand": s.on_hand, "reserved": s.reserved}
        for s in qs
    ]}

@router.get("/tms/shipments")
def list_shipments(db: Session = Depends(get_db)):
    qs = db.query(Shipment).order_by(Shipment.created_at.desc()).limit(50).all()
    return {"shipments":[
        {"id": str(sh.id), "order_id": str(sh.order_id), "carrier_id": str(sh.carrier_id),
         "tracking_number": sh.tracking_number, "status": sh.status,
         "created_at": sh.created_at.isoformat() if sh.created_at else None}
        for sh in qs
    ]}

@router.get("/wcs/tasks")
def list_tasks(db: Session = Depends(get_db)):
    qs = db.query(Task).order_by(Task.created_at.desc()).limit(100).all()
    return {"tasks":[
        {"id": str(t.id), "kind": t.kind, "order_id": str(t.order_id) if t.order_id else None,
         "status": t.status, "assignee": t.assignee}
        for t in qs
    ]}

@router.get("/wcs/waves")
def list_waves(db: Session = Depends(get_db)):
    qs = db.query(Wave).order_by(Wave.created_at.desc()).limit(50).all()
    return {"waves":[
        {"id": str(w.id), "status": w.status,
         "created_at": w.created_at.isoformat() if w.created_at else None}
        for w in qs
    ]}

# ---------- DEV SEED (for quick visual testing) ----------
@router.post("/dev/seed-demo")
def seed_demo(db: Session = Depends(get_db)):
    """
    DEV ONLY: create a tiny demo so the UI has something to show.
    Idempotent-ish; call again if needed.
    """
    # Create or find a tenant
    t = db.query(Tenant).filter(Tenant.name=="tregu-demo").one_or_none()
    if not t:
      t = Tenant(name="tregu-demo")
      db.add(t)
      db.flush()

    # Admin user (buyer/admin)
    admin = db.query(User).filter(User.email=="admin@tregu.local", User.tenant_id==t.id).one_or_none()
    if not admin:
      admin = User(tenant_id=t.id, email="admin@tregu.local", name="Admin", role="admin")
      db.add(admin); db.flush()
      assign_account_number_once(db, admin.id)

    # Warehouse
    wh = db.query(Warehouse).filter(Warehouse.tenant_id==t.id, Warehouse.code=="MAIN").one_or_none()
    if not wh:
      wh = Warehouse(tenant_id=t.id, code="MAIN", name="Main Warehouse")
      db.add(wh); db.flush()

    # Supplier + PO
    sup = db.query(Supplier).filter(Supplier.tenant_id==t.id, Supplier.code=="ACME").one_or_none()
    if not sup:
      sup = Supplier(tenant_id=t.id, code="ACME", name="ACME Supply", email="hello@acme.local", phone="555-0100")
      db.add(sup); db.flush()

    # Simple product
    prod = db.query(Product).filter(Product.tenant_id==t.id, Product.sku=="ECO-BOTTLE").one_or_none()
    if not prod:
      prod = Product(tenant_id=t.id, seller_id=admin.id, sku="ECO-BOTTLE",
                     name="Eco Bottle", description="Reusable bottle", price_cents=1299, active=True)
      db.add(prod); db.flush()

    # Stock row
    st = db.query(Stock).filter(Stock.tenant_id==t.id, Stock.warehouse_id==wh.id, Stock.sku=="ECO-BOTTLE").one_or_none()
    if not st:
      st = Stock(tenant_id=t.id, warehouse_id=wh.id, sku="ECO-BOTTLE", on_hand=100, reserved=0)
      db.add(st); db.flush()

    # Order + items
    ord_ = db.query(Order).filter(Order.tenant_id==t.id).order_by(Order.created_at.desc()).first()
    if not ord_:
      ord_ = Order(tenant_id=t.id, buyer_id=admin.id, status="paid", total_cents=2598)
      db.add(ord_); db.flush()
      item = OrderItem(order_id=ord_.id, sku="ECO-BOTTLE", qty=2, price_cents=1299)
      db.add(item); db.flush()

    # Carrier + shipment
    car = db.query(Carrier).filter(Carrier.tenant_id==t.id, Carrier.code=="UPS").one_or_none()
    if not car:
      car = Carrier(tenant_id=t.id, code="UPS", name="UPS", service_levels="ground,2-day,overnight")
      db.add(car); db.flush()

    shp = db.query(Shipment).filter(Shipment.order_id==ord_.id).one_or_none()
    if not shp:
      shp = Shipment(tenant_id=t.id, order_id=ord_.id, carrier_id=car.id, tracking_number="1ZTEST123", status="created")
      db.add(shp); db.flush()

    # WCS/WES: wave + task
    wave = db.query(Wave).filter(Wave.tenant_id==t.id).order_by(Wave.created_at.desc()).first()
    if not wave:
      wave_id = create_wave_for_order(db, t.id, ord_.id)
    db.commit()
    return {"ok": True, "tenant_id": str(t.id), "admin_id": str(admin.id), "warehouse_id": str(wh.id)}
