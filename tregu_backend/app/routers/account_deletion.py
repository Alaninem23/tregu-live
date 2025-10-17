from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.account_deletion import AccountDeletion
from ..models.users import User
from ..models.audit_log import AuditLog
from ..tasks.export_writer import write_encrypted_user_export
import io
import json
from starlette.responses import StreamingResponse

router = APIRouter(prefix="/account", tags=["account"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), authorization: str | None = None):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="unauthorized")
    return user

class DeleteRequestIn(BaseModel):
    reason: str | None = None

@router.post("/delete-request")
def request_delete(payload: DeleteRequestIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(AccountDeletion).filter(AccountDeletion.user_id == user.id, AccountDeletion.status == "pending").first()
    if existing:
        return {"status": "pending", "requested_at": existing.requested_at, "purge_after": existing.purge_after}
    ar = AccountDeletion(user_id=user.id, reason=payload.reason or None, requested_at=datetime.utcnow(), purge_after=datetime.utcnow() + timedelta(days=30), status="pending")
    if hasattr(user, "is_active"):
        user.is_active = False
    db.add(ar)
    db.add(AuditLog(actor_id=user.id, user_id=user.id, action="delete_requested", target_type="user", target_id=str(user.id), meta={"reason": payload.reason}))
    db.commit()
    db.refresh(ar)
    return {"status": "pending", "requested_at": ar.requested_at, "purge_after": ar.purge_after}

@router.post("/delete-undo")
def undo_delete(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ar = db.query(AccountDeletion).filter(AccountDeletion.user_id == user.id, AccountDeletion.status == "pending").first()
    if not ar:
        raise HTTPException(status_code=400, detail="no pending deletion")
    ar.status = "canceled"
    if hasattr(user, "is_active"):
        user.is_active = True
    db.add(AuditLog(actor_id=user.id, user_id=user.id, action="delete_canceled", target_type="user", target_id=str(user.id)))
    db.commit()
    return {"status": "canceled"}

@router.get("/delete-status")
def delete_status(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ar = db.query(AccountDeletion).filter(AccountDeletion.user_id == user.id, AccountDeletion.status == "pending").first()
    if not ar:
        return {"status": "none"}
    return {"status": "pending", "requested_at": ar.requested_at, "purge_after": ar.purge_after}

@router.get("/export")
def export_my_data(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = {
        "id": getattr(user, "id", None),
        "email": getattr(user, "email", None),
        "name": getattr(user, "name", None),
        "phone": getattr(user, "phone", None)
    }
    body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    buf = io.BytesIO(body)
    headers = {"Content-Disposition": f'attachment; filename="tregu_export_user_{user.id}.json"'}
    return StreamingResponse(buf, media_type="application/json", headers=headers)
