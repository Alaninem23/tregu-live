from __future__ import annotations
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from ..db import SessionLocal
try:
    from ..models import User
except Exception:
    User = None

router = APIRouter(prefix="/auth")

def serialize(u):
    if not u: return None
    return {
        "id": str(getattr(u,"id","")),
        "email": getattr(u,"email",""),
        "name": getattr(u,"name",None),
        "account_type": getattr(u,"account_type",None),
    }

def _apply_dev_password(u, payload: dict | None):
    # Minimal placeholder to satisfy NOT NULL constraint in dev.
    # If real hasher exists, you can hook it here.
    pwd = (payload or {}).get("password") or "devpass"
    try:
        setattr(u, "password_hash", pwd)  # plain value is fine for dev
    except Exception:
        pass
    # Optional: default role to avoid nulls in schemas that require it
    try:
        if getattr(u, "role", None) in (None, ""):
            setattr(u, "role", (payload or {}).get("role") or "buyer")
    except Exception:
        pass

@router.post("/signup")
@router.post("/register")
def signup(payload: dict):
    if User is None:
        raise HTTPException(500, "User model unavailable")
    email = (payload or {}).get("email","").strip().lower()
    if not email:
        raise HTTPException(400, "email required")
    with SessionLocal() as db:
        row = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if row:
            return {"id": str(row.id), "email": row.email}
        u = User(email=email)
        _apply_dev_password(u, payload)
        db.add(u); db.commit(); db.refresh(u)
        return {"id": str(u.id), "email": u.email}

@router.post("/login")
def login(payload: dict):
    if User is None:
        raise HTTPException(500, "User model unavailable")
    email = (payload or {}).get("email","").strip().lower()
    uid = (payload or {}).get("id")
    if not (uid or email):
        raise HTTPException(400, "email or id required")
    with SessionLocal() as db:
        row = None
        if uid:
            row = db.get(User, uid)
        if row is None and email:
            row = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
            if row is None and email:
                # DEV convenience: create on first login if missing
                u = User(email=email)
                _apply_dev_password(u, payload)
                db.add(u); db.commit(); db.refresh(u)
                row = u
        if row is None:
            raise HTTPException(404, "User not found")
        tok = f"dev:{getattr(row,'id','')}"
        return {"token": tok, "user": serialize(row)}
