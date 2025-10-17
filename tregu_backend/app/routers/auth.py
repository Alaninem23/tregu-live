from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..db import SessionLocal
from ..db_models import User, Tenant
from ..auth import verify_password, create_access_token, get_current_user
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str | None = None  # "buyer" or "seller" (defaults to buyer)

class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    tenant_id: uuid.UUID

class RegisterOut(BaseModel):
    user: UserOut
    access_token: str
    token_type: str = "bearer"
    message: str = "Account created"
    next: str = "/onboard"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=RegisterOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    # Registration endpoint with SHA256 hashing
    # Check for existing user
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create tenant
    tenant = Tenant(name=f"tenant-{payload.email.split('@')[0]}")
    db.add(tenant)
    db.flush()

    # Hash password with SHA256 (simpler than bcrypt)
    import hashlib
    hashed = hashlib.sha256(payload.password.encode()).hexdigest()

    # Create user
    user = User(
        tenant_id=tenant.id,
        email=payload.email,
        password_hash=hashed,
        role=(payload.role or "buyer"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token(str(user.id))

    return RegisterOut(
        user=UserOut(
            id=user.id,
            email=user.email,
            role=user.role,
            tenant_id=user.tenant_id,
        ),
        access_token=token,
    )

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(str(user.id))
    return LoginOut(
        access_token=token,
        user=UserOut(
            id=user.id,
            email=user.email,
            role=user.role,
            tenant_id=user.tenant_id,
        )
    )

@router.get("/2fa/status")
def get_2fa_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the current user's 2FA status"""
    try:
        from ..models import TwoFactorMethod
        methods = db.query(TwoFactorMethod).filter(TwoFactorMethod.user_id == str(current_user.id)).all()
        return {
            "enabled": len(methods) > 0,
            "methods": [method.method_type for method in methods]
        }
    except Exception:
        # If 2FA models don't exist, return disabled
        return {
            "enabled": False,
            "methods": []
        }
