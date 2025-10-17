import os, random, smtplib, ssl, hashlib, re
from email.message import EmailMessage
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.user import User

router = APIRouter()

class PaymentIn(BaseModel):
    cardholder: str
    number: str
    exp_month: int | None = None
    exp_year: int | None = None
    cvc: str
    billing_zip: str | None = None

class RegisterIn(BaseModel):
    role: str
    name: str | None = None
    email: EmailStr
    password: str
    phone: str | None = None
    companyName: str | None = None
    age: int | None = None
    gender: str | None = None
    state: str | None = None
    country: str | None = None
    zip: str | None = None
    ssn_full: str | None = None
    ein_tin: str | None = None
    plan: str | None = None
    billing_cycle: str | None = None
    pm: PaymentIn | None = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def gen_9digit(db: Session) -> str:
    for _ in range(20):
        n = ''.join(random.choice('0123456789') for _ in range(9))
        if not db.query(User).filter(User.account_number == n).first():
            return n
    raise HTTPException(status_code=500, detail="could not allocate account number")

def mask(n: str) -> str:
    if not n or len(n) < 5: return "****"
    return n[:2] + "*****" + n[-2:]

def hash_pw(p: str) -> str:
    return hashlib.sha256(p.encode('utf-8')).hexdigest()

def simple_hash(s: str) -> str:
    return hashlib.sha256(s.encode('utf-8')).hexdigest()

def normalize_card(number: str) -> str:
    return re.sub(r'[\s\-]', '', number or '')

def card_brand(number: str) -> str:
    n = normalize_card(number)
    if n.startswith('4'): return 'Visa'
    if n.startswith('5'): return 'Mastercard'
    if n.startswith('3'): return 'Amex'
    return 'Card'

def send_welcome(email: str, account_number: str, name: str | None):
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    pwd = os.getenv("SMTP_PASS")
    sender = os.getenv("SMTP_FROM", user or "no-reply@tregu.local")
    subject = "Welcome to Tregu"
    body = f"Welcome{(' ' + name) if name else ''}! Your Tregu account number is {account_number}."
    if host and user and pwd:
        msg = EmailMessage()
        msg["From"] = sender
        msg["To"] = email
        msg["Subject"] = subject
        msg.set_content(body)
        ctx = ssl.create_default_context()
        with smtplib.SMTP(host, port) as s:
            s.starttls(context=ctx)
            s.login(user, pwd)
            s.send_message(msg)
    else:
        print(f"[WELCOME] To:{email} Num:{account_number} Body:{body}")

@router.post("/register")
def register(inp: RegisterIn, db: Session = Depends(get_db)):
    role = (inp.role or '').strip().lower()
    if role not in ("buyer","seller"):
        raise HTTPException(status_code=400, detail="role must be buyer or seller")
    if db.query(User).filter(User.email == inp.email).first():
        raise HTTPException(status_code=409, detail="email already registered")

    if role == "seller":
        if not (inp.ssn_full or inp.ein_tin):
            raise HTTPException(status_code=400, detail="SSN or EIN/TIN required for business accounts")
        if not inp.pm or not inp.pm.cardholder or not inp.pm.number or not inp.pm.cvc:
            raise HTTPException(status_code=400, detail="payment method required for business accounts")
        if inp.plan not in ("starter","growth","pro","enterprise"):
            raise HTTPException(status_code=400, detail="invalid plan")
        if inp.billing_cycle not in ("monthly","yearly"):
            raise HTTPException(status_code=400, detail="invalid billing cycle")

    acct = gen_9digit(db)
    pw = hash_pw(inp.password)

    ssn_last4 = None
    ssn_hash = None
    ein_hash = None
    if inp.ssn_full:
        digits = re.sub(r'\D','', inp.ssn_full)
        if len(digits) != 9:
            raise HTTPException(status_code=400, detail="invalid SSN")
        ssn_last4 = digits[-4:]
        ssn_hash = simple_hash(digits)
    if inp.ein_tin:
        ein_hash = simple_hash(inp.ein_tin.strip())

    pm_brand = None
    pm_last4 = None
    pm_exp = None
    if role == "seller" and inp.pm:
        num = normalize_card(inp.pm.number)
        if not re.fullmatch(r'\d{12,19}', num):
            raise HTTPException(status_code=400, detail="invalid card number")
        pm_brand = card_brand(num)
        pm_last4 = num[-4:]
        if inp.pm.exp_month and inp.pm.exp_year:
            pm_exp = f"{int(inp.pm.exp_month):02d}/{int(inp.pm.exp_year)%100:02d}"

    user = User(
        email=str(inp.email),
        password_hash=pw,
        role=role,
        account_number=acct,
        name=inp.name or None,
        phone=inp.phone or None,
        company_name=inp.companyName if role=="seller" else None,
        age=str(inp.age) if inp.age is not None else None,
        gender=inp.gender or None,
        state=inp.state or None,
        country=inp.country or None,
        zip=inp.zip or None,
        ssn_last4=ssn_last4,
        ssn_hash=ssn_hash,
        ein_tin_hash=ein_hash,
        plan=inp.plan if role=="seller" else None,
        billing_cycle=inp.billing_cycle if role=="seller" else None,
        pm_brand=pm_brand,
        pm_last4=pm_last4,
        pm_exp=pm_exp
    )
    db.add(user)
    db.commit()
    send_welcome(str(inp.email), acct, inp.name)

    return {"ok": True, "account_number_masked": mask(acct)}
