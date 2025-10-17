from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import EmailStr
from app.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import RegisterIn, LoginIn, TokenPair, MeOut
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=MeOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    email: EmailStr = EmailStr(data.email.lower())
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=email, hashed_password=hash_password(data.password), role=data.role)  # <-- role saved
    db.add(user)
    db.commit()
    db.refresh(user)
    return MeOut(id=user.id, email=user.email, role=user.role, is_active=user.is_active)

@router.post("/login", response_model=TokenPair)
def login(data: LoginIn, db: Session = Depends(get_db)):
    email: EmailStr = EmailStr(data.email.lower())
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access = create_access_token(user_id=user.id, email=user.email)
    refresh = create_refresh_token(user_id=user.id, token_version=user.token_version)
    return TokenPair(access_token=access, refresh_token=refresh)

@router.get("/me", response_model=MeOut)
def me(current: User = Depends(get_current_user)):
    return MeOut(id=current.id, email=current.email, role=current.role, is_active=current.is_active)

@router.post("/logout")
def logout(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current.token_version += 1
    db.add(current)
    db.commit()
    return {"ok": True, "message": "Logged out. All refresh tokens revoked."}
