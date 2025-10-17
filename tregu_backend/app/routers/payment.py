import re, hashlib
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.user import User

router = APIRouter(prefix="/payment")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def normalize_card(number: str) -> str:
    return re.sub(r'[\s\-]', '', number or '')

def card_brand(number: str) -> str:
    n = normalize_card(number)
    if n.startswith('4'): return 'Visa'
    if n.startswith('5'): return 'Mastercard'
    if n.startswith('3'): return 'Amex'
    return 'Card'

class UpdatePMIn(BaseModel):
    email: EmailStr
    cardholder: str
    number: str
    exp: str
    cvc: str
    zip: str | None = None

@router.get("/method")
def get_method(email: EmailStr, db: Session = next(get_db())):
    u = db.query(User).filter(User.email == str(email)).first()
    if not u:
        raise HTTPException(status_code=404, detail="not found")
    return {"brand": u.pm_brand, "last4": u.pm_last4, "exp": u.pm_exp}

@router.post("/update")
def update_pm(body: UpdatePMIn):
    db: Session = next(get_db())
    u = db.query(User).filter(User.email == str(body.email)).first()
    if not u:
        raise HTTPException(status_code=404, detail="not found")
    n = normalize_card(body.number)
    if not re.fullmatch(r'\d{12,19}', n):
        raise HTTPException(status_code=400, detail="invalid card number")
    brand = card_brand(n)
    m = re.match(r'^\s*(\d{2})\s*/\s*(\d{2,4})\s*$', body.exp or '')
    if not m:
        raise HTTPException(status_code=400, detail="invalid expiration")
    mm = int(m.group(1))
    yy = m.group(2)
    if len(yy)==2: yy = "20"+yy
    exp = f"{mm:02d}/{int(yy)%100:02d}"
    u.pm_brand = brand
    u.pm_last4 = n[-4:]
    u.pm_exp = exp
    db.commit()
    return {"ok": True, "brand": brand, "last4": u.pm_last4, "exp": exp}
