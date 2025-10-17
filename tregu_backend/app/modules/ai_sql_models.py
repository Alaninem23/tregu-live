# tregu_backend/app/modules/ai_sql_models.py
# Python/SQLAlchemy version of the unified Tregu schema:
# - OMS, SCM, WMS, TMS, WCS/WES
# - Multitenant via tenant_id
# - 9-digit account numbers, unique and assigned once per user
# - Helper functions for stock moves and demo seed
#
# Requirements (already typical in your project):
#   SQLAlchemy >= 2.0, psycopg2, FastAPI stack
# Database: PostgreSQL 14+

from __future__ import annotations
import os
import random
import string
import uuid
from typing import Optional, List

from sqlalchemy import (
    Column, String, Integer, Boolean, Text, DateTime, ForeignKey, UniqueConstraint,
    CheckConstraint, func, text, Table, Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import UUID
try:
    # CITEXT extension type (works on Postgres if citext is enabled)
    from sqlalchemy.dialects.postgresql import CITEXT
except Exception:  # pragma: no cover
    CITEXT = String  # fallback to normal String if not available

from sqlalchemy.orm import declarative_base, relationship, Mapped, mapped_column, Session
from sqlalchemy.engine import Engine

Base = declarative_base()

# -------------------------
# Enums
# -------------------------
po_status = SAEnum("open", "confirmed", "received", "closed", name="po_status")
move_type = SAEnum("receipt", "reserve", "release", "ship", "adjust", name="move_type")
order_status = SAEnum("new", "paid", "picking", "packed", "shipped", "delivered", "cancelled", name="order_status")
ship_status = SAEnum("created", "picked", "in_transit", "delivered", "exception", name="ship_status")
task_status = SAEnum("queued", "in_progress", "done", "failed", name="task_status")
wave_status = SAEnum("planned", "released", "completed", name="wave_status")


# -------------------------
# Core & Tenancy
# -------------------------
class Tenant(Base):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "tregu"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
        {"schema": "tregu"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False)
    name: Mapped[str] = mapped_column(Text, default="", nullable=False)
    phone: Mapped[str] = mapped_column(Text, default="", nullable=False)
    role: Mapped[str] = mapped_column(String, default="buyer", nullable=False)  # buyer | seller | admin
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", backref="users", lazy="joined")
    account = relationship("UserAccountNumber", back_populates="user", uselist=False, lazy="selectin")


class UserAccountNumber(Base):
    __tablename__ = "user_account_numbers"
    __table_args__ = {"schema": "tregu"}

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tregu.users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    account_number: Mapped[str] = mapped_column(String(9), unique=True, nullable=False)

    user = relationship("User", back_populates="account")


def _generate_9_digit() -> str:
    """Generate a random 9-digit string, no leading zeros constraint needed (we allow '0' too)."""
    # Use 100,000,000..999,999,999 to ensure 9 digits
    return f"{random.randint(100_000_000, 999_999_999):09d}"


def assign_account_number_once(session: Session, user_id: uuid.UUID) -> str:
    """
    Assign a unique 9-digit account number to a user if they don't have one.
    Returns the existing/assigned number.
    Retries on collision (very unlikely).
    """
    # If already assigned, return it
    existing = session.get(UserAccountNumber, user_id)
    if existing:
        return existing.account_number

    tries = 0
    while True:
        tries += 1
        number = _generate_9_digit()
        try:
            rec = UserAccountNumber(user_id=user_id, account_number=number)
            session.add(rec)
            session.flush()  # check unique constraint immediately
            return number
        except Exception:
            session.rollback()
            if tries >= 20:
                raise RuntimeError("Could not generate a unique 9-digit account number after many tries")


# -------------------------
# Catalog / Products
# -------------------------
class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("tenant_id", "sku", name="uq_products_tenant_sku"),
        {"schema": "tregu"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    seller_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.users.id", ondelete="CASCADE"), nullable=False)
    sku: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# -------------------------
# SCM: Suppliers & POs
# -------------------------
class Supplier(Base):
    __tablename__ = "suppliers"
    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_suppliers_tenant_code"),
        {"schema": "tregu"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False)
    phone: Mapped[str] = mapped_column(String, default="", nullable=False)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    __table_args__ = (
        UniqueConstraint("tenant_id", "po_number", name="uq_po_tenant_number"),
        {"schema": "tregu"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    supplier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.suppliers.id", ondelete="RESTRICT"), nullable=False)
    po_number: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(po_status, nullable=False, default="open")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class POItem(Base):
    __tablename__ = "po_items"
    __table_args__ = {"schema": "tregu"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    po_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.purchase_orders.id", ondelete="CASCADE"), nullable=False)
    sku: Mapped[str] = mapped_column(String, nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_cents: Mapped[int] = mapped_column(Integer, nullable=False)


# -------------------------
# WMS: Warehouses & Stock
# -------------------------
class Warehouse(Base):
    __tablename__ = "warehouses"
    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_wh_tenant_code"),
        {"schema": "tregu"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)


class Stock(Base):
    __tablename__ = "stock"
    __table_args__ = (
        UniqueConstraint("tenant_id", "warehouse_id", "sku", name="pk_stock_tenant_wh_sku"),
        CheckConstraint("on_hand >= 0"),
        CheckConstraint("reserved >= 0"),
        {"schema": "tregu"},
    )

    # Composite key emulated by unique constraint (SQLAlchemy wants single pk)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.warehouses.id", ondelete="CASCADE"), nullable=False)
    sku: Mapped[str] = mapped_column(String, nullable=False)
    on_hand: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class StockMove(Base):
    __tablename__ = "stock_moves"
    __table_args__ = (
        CheckConstraint("qty <> 0"),
        {"schema": "tregu"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.warehouses.id", ondelete="RESTRICT"), nullable=False)
    sku: Mapped[str] = mapped_column(String, nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    kind: Mapped[str] = mapped_column(move_type, nullable=False)
    ref_type: Mapped[str] = mapped_column(String, nullable=False)   # 'PO','ORDER','SHIPMENT','ADJUST'
    ref_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


def _ensure_stock_row(session: Session, tenant_id: uuid.UUID, warehouse_id: uuid.UUID, sku: str) -> Stock:
    row = session.query(Stock).filter_by(tenant_id=tenant_id, warehouse_id=warehouse_id, sku=sku).one_or_none()
    if row is None:
        row = Stock(tenant_id=tenant_id, warehouse_id=warehouse_id, sku=sku, on_hand=0, reserved=0)
        session.add(row)
        session.flush()
    return row


def apply_stock_move(session: Session, move: StockMove) -> None:
    """
    Application-level balance updater (like the SQL trigger).
    Call this right after inserting a StockMove (before commit).
    """
    s = _ensure_stock_row(session, move.tenant_id, move.warehouse_id, move.sku)

    if move.kind == "receipt":
        s.on_hand += move.qty
    elif move.kind == "reserve":
        s.reserved += move.qty
    elif move.kind == "release":
        s.reserved = max(s.reserved - abs(move.qty), 0)
    elif move.kind == "ship":
        s.on_hand = max(s.on_hand - abs(move.qty), 0)
        s.reserved = max(s.reserved - abs(move.qty), 0)
    elif move.kind == "adjust":
        s.on_hand = max(s.on_hand + move.qty, 0)


# -------------------------
# OMS: Orders
# -------------------------
class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {"schema": "tregu"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.users.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(order_status, default="new", nullable=False)
    total_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = {"schema": "tregu"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.orders.id", ondelete="CASCADE"), nullable=False)
    sku: Mapped[str] = mapped_column(String, nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)


def reserve_stock_for_order(session: Session, order_id: uuid.UUID, warehouse_id: uuid.UUID) -> None:
    """Create 'reserve' stock moves for each order item and set status to 'picking'."""
    order = session.get(Order, order_id)
    if not order:
        raise ValueError(f"Order not found: {order_id}")
    items = session.query(OrderItem).filter_by(order_id=order_id).all()
    for it in items:
        mv = StockMove(
            tenant_id=order.tenant_id,
            warehouse_id=warehouse_id,
            sku=it.sku,
            qty=it.qty,
            kind="reserve",
            ref_type="ORDER",
            ref_id=order_id,
        )
        session.add(mv)
        session.flush()
        apply_stock_move(session, mv)

    if order.status in ("new", "paid"):
        order.status = "picking"


def ship_order(session: Session, order_id: uuid.UUID, warehouse_id: uuid.UUID,
               shipment_id: Optional[uuid.UUID], carrier_id: uuid.UUID, tracking: Optional[str]) -> None:
    """Deduct stock via 'ship', create a shipment shell, set order status."""
    order = session.get(Order, order_id)
    if not order:
        raise ValueError(f"Order not found: {order_id}")

    items = session.query(OrderItem).filter_by(order_id=order_id).all()
    for it in items:
        mv = StockMove(
            tenant_id=order.tenant_id,
            warehouse_id=warehouse_id,
            sku=it.sku,
            qty=it.qty,
            kind="ship",
            ref_type="ORDER",
            ref_id=order_id,
        )
        session.add(mv)
        session.flush()
        apply_stock_move(session, mv)

    if shipment_id is None:
        shipment_id = uuid.uuid4()

    sh = Shipment(
        id=shipment_id,
        tenant_id=order.tenant_id,
        order_id=order_id,
        carrier_id=carrier_id,
        tracking_number=tracking or None,
        status="created",
    )
    # do nothing if duplicate id
    if session.get(Shipment, shipment_id) is None:
        session.add(sh)

    order.status = "shipped"


# -------------------------
# TMS: Carriers & Shipments
# -------------------------
class Carrier(Base):
    __tablename__ = "carriers"
    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_carriers_tenant_code"),
        {"schema": "tregu"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    # service_levels: store as simple comma list for portability
    service_levels: Mapped[str] = mapped_column(Text, default="ground,2-day,overnight", nullable=False)


class Shipment(Base):
    __tablename__ = "shipments"
    __table_args__ = {"schema": "tregu"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.orders.id", ondelete="CASCADE"), nullable=False)
    carrier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.carriers.id", ondelete="RESTRICT"), nullable=False)
    tracking_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(ship_status, default="created", nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TrackingEvent(Base):
    __tablename__ = "tracking_events"
    __table_args__ = {"schema": "tregu"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    shipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.shipments.id", ondelete="CASCADE"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# -------------------------
# WCS/WES: Tasks & Waves
# -------------------------
class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"schema": "tregu"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # pick/pack/putaway/move
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.orders.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(task_status, default="queued", nullable=False)
    assignee: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Wave(Base):
    __tablename__ = "waves"
    __table_args__ = {"schema": "tregu"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tenants.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(wave_status, default="planned", nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WaveTask(Base):
    __tablename__ = "wave_tasks"
    __table_args__ = (
        UniqueConstraint("wave_id", "task_id", name="pk_wave_task"),
        {"schema": "tregu"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wave_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.waves.id", ondelete="CASCADE"), nullable=False)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tregu.tasks.id", ondelete="CASCADE"), nullable=False)


def create_wave_for_order(session: Session, tenant_id: uuid.UUID, order_id: uuid.UUID) -> uuid.UUID:
    """Create a picking wave with one pick task per order item, return wave id."""
    wave_id = uuid.uuid4()
    wave = Wave(id=wave_id, tenant_id=tenant_id, status="planned")
    session.add(wave)

    items = session.query(OrderItem).filter_by(order_id=order_id).all()
    for _ in items:
        t = Task(tenant_id=tenant_id, kind="pick", order_id=order_id, status="queued")
        session.add(t)
        session.flush()
        session.add(WaveTask(wave_id=wave_id, task_id=t.id))

    session.flush()
    return wave_id


# -------------------------
# Views (optional analytics)
# -------------------------
VIEWS_SQL = """
CREATE OR REPLACE VIEW tregu.v_stock_position AS
SELECT
  s.tenant_id,
  s.warehouse_id,
  s.sku,
  s.on_hand,
  s.reserved,
  (s.on_hand - s.reserved) AS available
FROM tregu.stock s;

CREATE OR REPLACE VIEW tregu.v_order_value AS
SELECT
  o.id as order_id,
  o.tenant_id,
  o.status,
  SUM(oi.qty * oi.price_cents) AS total_cents
FROM tregu.orders o
JOIN tregu.order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.tenant_id, o.status;
"""


# -------------------------
# Init helpers
# -------------------------
def init_db_schema(engine: Engine) -> None:
    """Create schema, enable extensions (if possible), create tables, and views."""
    with engine.begin() as conn:
        # Extensions (safe to skip if not allowed)
        try:
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        except Exception:
            pass
        try:
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "citext";'))
        except Exception:
            pass

        # Schema
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS tregu AUTHORIZATION CURRENT_USER;"))
        # Create all tables
        Base.metadata.create_all(bind=conn)
        # Views
        try:
            conn.execute(text(VIEWS_SQL))
        except Exception:
            pass


def seed_minimal_demo(session: Session) -> tuple[uuid.UUID, uuid.UUID, uuid.UUID]:
    """
    Create a minimal demo: tenant, admin user (with account number), and a warehouse.
    Returns (tenant_id, admin_id, warehouse_id).
    """
    t_id = uuid.uuid4()
    u_id = uuid.uuid4()
    w_id = uuid.uuid4()

    t = Tenant(id=t_id, name="tregu-demo")
    session.add(t)

    admin = User(id=u_id, tenant_id=t_id, email="admin@tregu.local", name="Admin", role="admin")
    session.add(admin)
    session.flush()  # so user row exists for FK

    # assign 9-digit account number once
    assign_account_number_once(session, u_id)

    wh = Warehouse(id=w_id, tenant_id=t_id, code="MAIN", name="Main WH")
    session.add(wh)

    session.commit()
    return t_id, u_id, w_id
