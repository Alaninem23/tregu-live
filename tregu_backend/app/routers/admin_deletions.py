from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.account_deletion import AccountDeletion
from ..models.users import User
from ..models.audit_log import AuditLog
from ..tasks.export_writer import write_encrypted_user_export
import os

router = APIRouter(prefix="/admin/deletions", tags=["admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_admin(x_admin_key: str | None = Header(default=None)):
    required = os.getenv("ADMIN_API_KEY", "")
    if not required or x_admin_key != required:
        raise HTTPException(status_code=401, detail="unauthorized")
    return True

@router.get("/list")
def list_pending(db: Session = Depends(get_db), _: bool = Depends(require_admin)):
    q = db.query(AccountDeletion).filter(AccountDeletion.status == "pending").all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "requested_at": r.requested_at,
            "purge_after": r.purge_after,
            "status": r.status
        } for r in q
    ]

@router.post("/restore")
def restore(user_id: int, db: Session = Depends(get_db), _: bool = Depends(require_admin)):
    r = db.query(AccountDeletion).filter(AccountDeletion.user_id == user_id, AccountDeletion.status == "pending").first()
    if not r:
        raise HTTPException(status_code=404, detail="not found")
    r.status = "canceled"
    u = db.query(User).filter(User.id == user_id).first()
    if u and hasattr(u, "is_active"):
        u.is_active = True
    db.add(AuditLog(actor_id=None, user_id=user_id, action="admin_restore", target_type="user", target_id=str(user_id)))
    db.commit()
    return {"status": "canceled"}

@router.post("/export")
def force_export(user_id: int, db: Session = Depends(get_db), _: bool = Depends(require_admin)):
    path = write_encrypted_user_export(db, user_id, actor_id=None)
    if not path:
        raise HTTPException(status_code=404, detail="user not found")
    db.add(AuditLog(actor_id=None, user_id=user_id, action="admin_force_export", target_type="user", target_id=str(user_id), meta={"path": path}))
    db.commit()
    return {"path": path}
