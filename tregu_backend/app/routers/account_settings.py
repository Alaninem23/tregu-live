from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.user import User
import hashlib

router = APIRouter(prefix="/account")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_pw(p: str) -> str:
    return hashlib.sha256(p.encode("utf-8")).hexdigest()

class UpdateProfileIn(BaseModel):
    email: EmailStr
    name: str | None = None
    phone: str | None = None
    companyName: str | None = None
    age: int | None = None
    gender: str | None = None
    state: str | None = None
    country: str | None = None
    zip: str | None = None
    allowsSearch: bool | None = None
    marketingEmails: bool | None = None

@router.post("/update")
def update_profile(body: UpdateProfileIn):
    db: Session = next(get_db())
    u = db.query(User).filter(User.email == body.email).first()
    if not u:
        raise HTTPException(status_code=404, detail="not found")
    if u.role == "seller":
        if body.companyName is not None:
            u.company_name = body.companyName
    if body.name is not None:
        u.name = body.name
    if body.phone is not None:
        u.phone = body.phone
    if body.age is not None:
        u.age = str(body.age)
    if body.gender is not None:
        u.gender = body.gender
    if body.state is not None:
        u.state = body.state
    if body.country is not None:
        u.country = body.country
    if body.zip is not None:
        u.zip = body.zip
    db.commit()
    return {"ok": True}

class ChangePasswordIn(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str

@router.post("/change-password")
def change_password(body: ChangePasswordIn):
    db: Session = next(get_db())
    u = db.query(User).filter(User.email == body.email).first()
    if not u:
        raise HTTPException(status_code=404, detail="not found")
    if u.password_hash != hash_pw(body.current_password):
        raise HTTPException(status_code=403, detail="invalid credentials")
    u.password_hash = hash_pw(body.new_password)
    db.commit()
    return {"ok": True}

class ChangeEmailIn(BaseModel):
    email: EmailStr
    password: str
    new_email: EmailStr

@router.post("/change-email")
def change_email(body: ChangeEmailIn):
    db: Session = next(get_db())
    u = db.query(User).filter(User.email == body.email).first()
    if not u:
        raise HTTPException(status_code=404, detail="not found")
    if db.query(User).filter(User.email == body.new_email).first():
        raise HTTPException(status_code=409, detail="email in use")
    if u.password_hash != hash_pw(body.password):
        raise HTTPException(status_code=403, detail="invalid credentials")
    u.email = str(body.new_email)
    db.commit()
    return {"ok": True, "email": u.email}
