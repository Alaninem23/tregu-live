# app/security.py  (ORIGINAL for Tregu)
from __future__ import annotations
import os, time, uuid
from typing import Dict, Any
import jwt  # PyJWT
from passlib.context import CryptContext

# --- Password hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# --- JWT settings ---
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
ACCESS_TTL_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRES_MIN", "60"))  # minutes

def create_access_token(sub: str, role: str) -> str:
    now = int(time.time())
    payload = {
        "sub": sub,               # user id
        "role": role,             # user role
        "iat": now,
        "exp": now + ACCESS_TTL_MIN * 60,
        "jti": str(uuid.uuid4()),
        "iss": "tregu-api",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
