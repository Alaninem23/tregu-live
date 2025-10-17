from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import models, schemas
from ..auth import get_db, get_current_user

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("", response_model=schemas.BookingOut)
def create_booking(b: schemas.BookingIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    last = db.query(models.Booking)        .filter(models.Booking.pod_id == b.pod_id, models.Booking.seller_id == b.seller_id)        .order_by(models.Booking.end_date.desc()).first()
    if last and (b.start_date - last.end_date).days < 30:
        raise HTTPException(status_code=409, detail="30-day rotation rule violated")
    booking = models.Booking(**b.model_dump(), tenant_id=user.tenant_id, status="confirmed")
    db.add(booking); db.commit(); db.refresh(booking)
    return booking

@router.get("")
def list_bookings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Booking).filter(models.Booking.tenant_id == user.tenant_id).all()
