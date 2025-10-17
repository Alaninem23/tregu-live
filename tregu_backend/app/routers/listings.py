from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.listing import Listing
from ..risk.flags import flags
from ..risk.moderation import scan

router = APIRouter(prefix="/listings", tags=["listings"])

class ListingIn(BaseModel):
    seller_id: str
    seller_name: str
    title: str
    body: str | None = None
    category: str | None = None
    tags: list[str] | None = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("")
def list_all(db: Session = Depends(get_db)):
    rows = db.query(Listing).order_by(Listing.id.desc()).all()
    out = []
    for r in rows:
        out.append({
            "id": r.id,
            "seller_id": r.seller_id,
            "seller_name": r.seller_name,
            "title": r.title,
            "body": r.body,
            "category": r.category,
            "tags": (r.tags.split(",") if r.tags else []),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return out

@router.post("")
def create(inp: ListingIn, db: Session = Depends(get_db)):
    if not flags["enableListings"]:
        raise HTTPException(status_code=503, detail="listings disabled")
    if scan(inp.title) or scan(inp.body or ""):
        raise HTTPException(status_code=400, detail="violates policy")
    rec = Listing(
        seller_id=inp.seller_id,
        seller_name=inp.seller_name,
        title=inp.title,
        body=inp.body,
        category=inp.category,
        tags=",".join(inp.tags) if inp.tags else None,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"id": rec.id}

@router.get("/{listing_id}")
def get_one(listing_id: int, db: Session = Depends(get_db)):
    r = db.query(Listing).get(listing_id)
    if not r:
        raise HTTPException(status_code=404, detail="not found")
    return {
        "id": r.id,
        "seller_id": r.seller_id,
        "seller_name": r.seller_name,
        "title": r.title,
        "body": r.body,
        "category": r.category,
        "tags": (r.tags.split(",") if r.tags else []),
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }

@router.delete("/{listing_id}")
def delete_one(listing_id: int, db: Session = Depends(get_db)):
    r = db.query(Listing).get(listing_id)
    if not r:
        raise HTTPException(status_code=404, detail="not found")
    db.delete(r)
    db.commit()
    return {"ok": True}
