import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.account_deletion import AccountDeletion
from ..models.users import User
from ..models.audit_log import AuditLog
from .export_writer import write_encrypted_user_export

async def purge_loop():
    while True:
        try:
            run_purge()
        except Exception:
            pass
        await asyncio.sleep(24 * 60 * 60)

def run_purge():
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        pending = db.query(AccountDeletion).filter(AccountDeletion.status == "pending", AccountDeletion.purge_after <= now).all()
        for ar in pending:
            user = db.query(User).filter(User.id == ar.user_id).first()
            if user:
                try:
                    write_encrypted_user_export(db, user.id, actor_id=None)
                except Exception:
                    pass
                if hasattr(user, "email"):
                    user.email = f"deleted+{user.id}@example.invalid"
                if hasattr(user, "phone"):
                    user.phone = None
                if hasattr(user, "name"):
                    user.name = None
                if hasattr(user, "is_active"):
                    user.is_active = False
            ar.status = "purged"
            db.add(AuditLog(actor_id=None, user_id=ar.user_id, action="purged", target_type="user", target_id=str(ar.user_id)))
            db.commit()
    finally:
        db.close()
