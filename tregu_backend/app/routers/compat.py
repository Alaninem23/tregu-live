from __future__ import annotations
import os, uuid, shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from starlette.responses import JSONResponse
import httpx

# Try DB imports but don't crash if missing
try:
    from sqlalchemy import select, or_
    from ..db import SessionLocal
    from ..models import Product
    from ..models.listing import Listing
    from ..models.seller import Seller
    HAS_DB = True
except Exception:
    HAS_DB = False
    Product = None
    Listing = None
    Seller = None
    SessionLocal = None

router = APIRouter()

MEDIA_ROOT = os.getenv("MEDIA_ROOT", "./media")
os.makedirs(MEDIA_ROOT, exist_ok=True)

# ---- DEV fallback toggle ----
DEV_FAKE_REGISTER = os.getenv("DEV_FAKE_REGISTER", "0").lower() in ("1", "true", "yes", "on")

# Dev-only register stub (used if real /auth/register is missing)
async def _dev_register(payload: dict):
    email = (payload or {}).get("email")
    password = (payload or {}).get("password")
    role = (payload or {}).get("role") or "buyer"
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password required")
    return JSONResponse(
        status_code=201,
        content={
            "id": uuid.uuid4().hex,
            "email": email,
            "role": role,
            "status": "created(dev)",
        },
    )

@router.post("/auth/signup")
async def signup_alias(payload: dict):
    """
    Frontend posts here; we forward to /auth/register (or dev fallback).
    """
    # If dev fallback enabled, short-circuit
    if DEV_FAKE_REGISTER:
        return await _dev_register(payload)

    base = os.getenv("SELF_BASE_URL", "http://127.0.0.1:8000")
    url = f"{base}/auth/register"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(url, json=payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream error contacting {url}: {e}")
    ct = r.headers.get("content-type","")
    if "application/json" in ct:
        try:
            return JSONResponse(status_code=r.status_code, content=r.json())
        except Exception:
            return JSONResponse(status_code=r.status_code, content={"detail": r.text})
    return JSONResponse(status_code=r.status_code, content={"detail": r.text})

@router.post("/files/upload")
async def files_upload(file: UploadFile = File(...)):
    """
    Saves uploaded file to MEDIA_ROOT and returns the /media URL.
    """
    ext = os.path.splitext(file.filename or "")[1]
    name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(MEDIA_ROOT, name)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    url = f"/media/{name}"
    size = os.path.getsize(dest)
    return {"filename": name, "url": url, "size": size, "content_type": file.content_type}

@router.get("/search")
def search(q: str = "", state: str = "", city: str = "", zip: str = ""):
    """
    Basic listing search by title/body and location. Empty q returns up to 20.
    Location filtering is currently placeholder - will filter by seller location when implemented.
    Returns empty list if DB or Listing model is unavailable.
    """
    if not HAS_DB or Listing is None or Seller is None or SessionLocal is None:
        return {"count": 0, "results": []}
    with SessionLocal() as db:
        # Build query with joins
        query = select(Listing, Seller.logo_url).join(Seller, Listing.seller_id == Seller.account_id)
        
        # Add search filters
        if q:
            query = query.where(
                or_(
                    Listing.title.ilike(f"%{q}%"),
                    Listing.body.ilike(f"%{q}%")
                )
            )
        
        # TODO: Add location filtering when seller/location relationships are established
        # For now, location parameters are accepted but not used in filtering
        
        # Apply limit
        query = query.limit(50 if q else 20)
        
        rows = db.execute(query).all()
    results = []
    for r in rows:
        listing, logo_url = r
        results.append({
            "id": str(listing.id),
            "seller_name": listing.seller_name,
            "title": listing.title,
            "body": listing.body,
            "logo_url": logo_url,
        })
    return {"count": len(results), "results": results}
