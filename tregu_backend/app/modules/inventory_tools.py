"""
Tregu Inventory Tools (Original Code)
- Pure-Python helpers you (and your internal AI/automation) can call
- Also exposes a small /inventory/tools endpoint to invoke a reorder suggestion

DROP-IN:
  - Save as: tregu_backend/app/modules/inventory_tools.py
  - Optional API exposure in main.py:
      from app.modules.inventory_tools import router as inventory_tools_router
      app.include_router(inventory_tools_router)
"""

from __future__ import annotations
import os
import uuid
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine

try:
    from ..db import get_session  # type: ignore
    HAVE_APP_DB = True
except Exception:
    HAVE_APP_DB = False

from .ai_sql_models import Stock, Product

SessionLocal = None
if not HAVE_APP_DB:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL required for inventory_tools when ..db.get_session not available")
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

# ---------- Pure helpers (import these from anywhere) ----------

def summarize_inventory(session: Session, tenant_id: uuid.UUID) -> Dict[str, int]:
    """
    Returns simple totals for dashboard tiles.
    """
    on_hand = reserved = 0
    for row in session.execute(select(Stock.on_hand, Stock.reserved).where(Stock.tenant_id == tenant_id)):
        on_hand += row[0]
        reserved += row[1]
    return {
        "sku_positions": session.execute(
            select(Stock.sku).where(Stock.tenant_id == tenant_id).distinct()
        ).rowcount or 0,
        "on_hand_total": on_hand,
        "reserved_total": reserved,
        "available_total": on_hand - reserved
    }

def suggest_reorder(session: Session, tenant_id: uuid.UUID, threshold: int = 10) -> List[Dict]:
    """
    Naive reorder suggestion: available < threshold -> suggest top-up to threshold*3
    """
    out: List[Dict] = []
    # Available by SKU summed across warehouses
    rows = session.execute(
        select(Stock.sku, (Stock.on_hand - Stock.reserved))
        .where(Stock.tenant_id == tenant_id)
    ).all()
    by_sku: Dict[str, int] = {}
    for sku, avail in rows:
        by_sku[sku] = by_sku.get(sku, 0) + int(avail)

    for sku, avail in by_sku.items():
        if avail < threshold:
            target = threshold * 3
            out.append({"sku": sku, "available": avail, "suggest_qty": max(target - avail, 0)})

    # Optional: include product names for UI
    if out:
        sku_list = [o["sku"] for o in out]
        pmap = {p.sku: p.name for p in session.execute(
            select(Product).where(Product.tenant_id == tenant_id, Product.sku.in_(sku_list))
        ).scalars().all()}
        for o in out:
            o["name"] = pmap.get(o["sku"], o["sku"])
    return out

# ---------- Optional small API wrapper ----------
router = APIRouter(prefix="/inventory/tools", tags=["inventory-tools"])

class ReorderIn(BaseModel):
    tenant_id: uuid.UUID
    threshold: int = 10

@router.post("/reorder")
def api_reorder(payload: ReorderIn, db: Session = Depends(session_dep)):
    return {"items": suggest_reorder(db, payload.tenant_id, payload.threshold)}
