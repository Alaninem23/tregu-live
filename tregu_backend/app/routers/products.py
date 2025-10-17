from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..auth import get_db, get_current_user

router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=schemas.ProductOut)
def create_product(p: schemas.ProductIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    product = models.Product(**p.model_dump(), tenant_id=user.tenant_id)
    db.add(product); db.commit(); db.refresh(product)
    return product

@router.get("")
def list_products(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Product).filter(models.Product.tenant_id == user.tenant_id, models.Product.is_active == True).all()
