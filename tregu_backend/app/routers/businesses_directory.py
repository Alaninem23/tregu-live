from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.seller import Seller

router = APIRouter(prefix="/sellers", tags=["sellers"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("")
def list_sellers(db: Session = Depends(get_db)):
    rows = db.query(Seller).order_by(Seller.id.desc()).all()
    out = []
    for r in rows:
        out.append({
            "accountId": r.account_id,
            "email": r.email,
            "name": r.name,
            "companyName": r.company_name,
            "logoUrl": r.logo_url,
            "role": "business",
        })
    return out

@router.get("/{account_id}")
def get_seller(account_id: str, db: Session = Depends(get_db)):
    r = db.query(Seller).filter(Seller.account_id == account_id).first()
    if not r:
        return {}
    return {
        "accountId": r.account_id,
        "email": r.email,
        "name": r.name,
        "companyName": r.company_name,
        "logoUrl": r.logo_url,
        "role": "business",
    }

