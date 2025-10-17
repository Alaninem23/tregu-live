"""
Tregu WCS/WES (Advanced, Original Code)
- Create pick tasks from orders
- Group tasks into waves
- Release waves to floor, assign tasks, start/complete
- Lightweight, operator-friendly control surface

DROP-IN:
  - Place at: tregu_backend/app/modules/wcs_wes_adv.py
  - Wire in main.py:
      from app.modules.wcs_wes_adv import router as wcs_router
      app.include_router(wcs_router)
"""

from __future__ import annotations
import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, and_
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine

try:
    from ..db import get_session  # type: ignore
    HAVE_APP_DB = True
except Exception:
    HAVE_APP_DB = False

from .ai_sql_models import (
    Task, Wave, WaveTask, OrderItem, create_wave_for_order
)

SessionLocal = None
if not HAVE_APP_DB:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL required for WCS/WES when ..db.get_session unavailable")
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

router = APIRouter(prefix="/wcs", tags=["wcs/wes"])

# ---------- Schemas ----------
class WaveOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    status: str

class TaskOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    kind: str
    order_id: Optional[uuid.UUID]
    status: str
    assignee: Optional[str]

class CreateWaveIn(BaseModel):
    tenant_id: uuid.UUID
    order_id: uuid.UUID

class WaveStatusIn(BaseModel):
    status: str  # planned | released | completed

class AssignTaskIn(BaseModel):
    assignee: str

class TaskStatusIn(BaseModel):
    status: str  # queued | in_progress | done | failed

# ---------- Waves ----------
@router.post("/waves", response_model=WaveOut)
def create_wave(payload: CreateWaveIn, db: Session = Depends(session_dep)):
    wid = create_wave_for_order(db, payload.tenant_id, payload.order_id)
    w = db.get(Wave, wid)
    return WaveOut(id=w.id, tenant_id=w.tenant_id, status=w.status)

@router.get("/waves", response_model=List[WaveOut])
def list_waves(
    tenant_id: uuid.UUID,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(session_dep),
):
    stmt = select(Wave).where(Wave.tenant_id == tenant_id)
    if status:
        stmt = stmt.where(Wave.status == status)
    stmt = stmt.order_by(Wave.id.desc()).offset((page-1)*page_size).limit(page_size)
    rows = db.execute(stmt).scalars().all()
    return [WaveOut(id=w.id, tenant_id=w.tenant_id, status=w.status) for w in rows]

@router.post("/waves/{wave_id}/status", response_model=WaveOut)
def set_wave_status(wave_id: uuid.UUID, payload: WaveStatusIn, db: Session = Depends(session_dep)):
    w = db.get(Wave, wave_id)
    if not w:
        raise HTTPException(404, "wave not found")
    allowed = {"planned","released","completed"}
    if payload.status not in allowed:
        raise HTTPException(400, "invalid status")
    w.status = payload.status
    db.commit(); db.refresh(w)
    return WaveOut(id=w.id, tenant_id=w.tenant_id, status=w.status)

# ---------- Tasks ----------
@router.get("/waves/{wave_id}/tasks", response_model=List[TaskOut])
def tasks_in_wave(wave_id: uuid.UUID, db: Session = Depends(session_dep)):
    rows = db.execute(
        select(Task).join(WaveTask, WaveTask.task_id == Task.id).where(WaveTask.wave_id == wave_id)
    ).scalars().all()
    return [TaskOut(
        id=t.id, tenant_id=t.tenant_id, kind=t.kind, order_id=t.order_id, status=t.status, assignee=t.assignee
    ) for t in rows]

@router.post("/tasks/{task_id}/assign", response_model=TaskOut)
def assign_task(task_id: uuid.UUID, payload: AssignTaskIn, db: Session = Depends(session_dep)):
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(404, "task not found")
    t.assignee = payload.assignee
    if t.status == "queued":
        t.status = "in_progress"
    db.commit(); db.refresh(t)
    return TaskOut(
        id=t.id, tenant_id=t.tenant_id, kind=t.kind, order_id=t.order_id, status=t.status, assignee=t.assignee
    )

@router.post("/tasks/{task_id}/status", response_model=TaskOut)
def set_task_status(task_id: uuid.UUID, payload: TaskStatusIn, db: Session = Depends(session_dep)):
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(404, "task not found")
    allowed = {"queued","in_progress","done","failed"}
    if payload.status not in allowed:
        raise HTTPException(400, "invalid status")
    t.status = payload.status
    db.commit(); db.refresh(t)
    return TaskOut(
        id=t.id, tenant_id=t.tenant_id, kind=t.kind, order_id=t.order_id, status=t.status, assignee=t.assignee
    )
