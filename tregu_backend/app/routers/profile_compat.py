from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from ..db import SessionLocal
try:
    from ..models import User
except Exception:
    User = None

router = APIRouter()

def serialize(u):
    if not u: return None
    return {"id": str(getattr(u,"id","")), "email": getattr(u,"email",""), "name": getattr(u,"name",None), "account_type": getattr(u,"account_type",None)}

def parse_token(request: Request):
    auth = request.headers.get("authorization","")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    tok = auth.split(" ",1)[1]
    if tok.startswith("devemail:"):
        return ("devemail", tok[len("devemail:"):].strip().lower())
    if tok.startswith("dev:"):
        return ("dev", tok.split(":",1)[1])
    return ("other", tok)

@router.get("/users/me")
def users_me(request: Request):
    kind, val = parse_token(request)
    if kind == "devemail":
        return {"id": "", "email": val, "name": None, "account_type": None}
    if User is None: raise HTTPException(500, "User model unavailable")
    with SessionLocal() as db:
        u = db.get(User, val) if kind == "dev" else None
        if not u:
            raise HTTPException(401, "Invalid user")
        return serialize(u)