from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..auth import get_db, get_current_user

router = APIRouter(prefix="/sellers", tags=["sellers"])

@router.post("", response_model=schemas.SellerOut)
def create_seller(s: schemas.SellerIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    seller = models.Seller(name=s.name, tenant_id=user.tenant_id)
    db.add(seller); db.commit(); db.refresh(seller)
    return seller

@router.get("")
def list_sellers(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Seller).filter(models.Seller.tenant_id == user.tenant_id).all()
