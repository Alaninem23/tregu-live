from datetime import datetime, timedelta, timezone
from passlib.hash import bcrypt
import jwt as pyjwt
import uuid
from typing import Optional
from fastapi import HTTPException, status, Depends, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES
from .db import SessionLocal
from . import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(pw: str) -> str:
    # Simple hash for testing - replace with proper bcrypt later
    import hashlib
    return hashlib.sha256(pw.encode()).hexdigest()

def verify_password(pw: str, hashed: str) -> bool:
    # Try bcrypt first, then fallback to SHA256 for testing
    try:
        from passlib.hash import bcrypt
        return bcrypt.verify(pw, hashed)
    except:
        # Fallback to SHA256 for testing
        import hashlib
        return hashlib.sha256(pw.encode()).hexdigest() == hashed

def create_access_token(sub: str) -> str:
    to_encode = {"sub": sub, "iat": datetime.now(timezone.utc)}
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return pyjwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id_str = payload.get("sub")
        user_id = uuid.UUID(user_id_str)  # Convert string to UUID
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_current_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> models.User | None:
    """Get current user if authenticated, otherwise return None"""
    if not authorization:
        return None

    # Extract token from "Bearer <token>" format
    token = authorization.replace("Bearer ", "")

    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id_str = payload.get("sub")
        user_id = uuid.UUID(user_id_str)  # Convert string to UUID
    except Exception:
        return None
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user
