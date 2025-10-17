import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.audit_log import AuditLog
from ..utils.crypto import encrypt_bytes

def secure_dir():
    d = os.getenv("SECURE_EXPORT_DIR", "/app/secure_exports")
    os.makedirs(d, exist_ok=True)
    return d

def export_user_json(db: Session, user) -> bytes:
    payload = {
        "id": getattr(user, "id", None),
        "email": getattr(user, "email", None),
        "name": getattr(user, "name", None),
        "phone": getattr(user, "phone", None),
        "is_active": getattr(user, "is_active", None),
        "exported_at": datetime.utcnow().isoformat() + "Z"
    }
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

def write_encrypted_user_export(db: Session, user_id: int, actor_id: int | None = None) -> str:
    from ..models.users import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return ""
    raw = export_user_json(db, user)
    enc = encrypt_bytes(raw)
    path = os.path.join(secure_dir(), f"user_{user.id}_{int(datetime.utcnow().timestamp())}.bin")
    with open(path, "wb") as f:
        f.write(enc)
    log = AuditLog(actor_id=actor_id, user_id=user.id, action="export_encrypted", target_type="user", target_id=str(user.id), meta={"path": path})
    db.add(log)
    db.commit()
    return path
