# tregu_backend/app/modules/maps.py
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import math
import uuid

from sqlalchemy import (
    Column, String, DateTime, Float, Boolean, Text, Integer,
    ForeignKey, UniqueConstraint, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, mapped_column, Mapped, Session

from ..db import get_db

# Local Base for maps module
Base = declarative_base()

# -----------------------------
# MODELS
# -----------------------------
class MapLocation(Base):
    __tablename__ = "map_locations"
    __table_args__ = {"schema": "tregu"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    # Identifiers
    external_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    source: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    # Basic info
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    
    # Coordinates
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Classification
    location_type: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pod_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MapPreference(Base):
    __tablename__ = "map_preferences"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_map_prefs_user"),
        {"schema": "tregu"}
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# -----------------------------
# SCHEMAS
# -----------------------------
class GeoJSONPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [lng, lat]


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONPoint
    properties: Dict[str, Any] = {}


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


class MapLocationOut(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    location_type: Optional[str] = None
    tags: Optional[str] = None
    pod_capacity: Optional[int] = None
    distance_km: Optional[float] = None


class VerifyLocationIn(BaseModel):
    user_id: str
    verify: bool


class LocateIn(BaseModel):
    user_id: str
    lat: float
    lng: float


# -----------------------------
# UTILS
# -----------------------------
def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    R = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlng/2)**2
    return 2 * R * math.asin(math.sqrt(a))


def _to_out(loc: MapLocation, distance_km: Optional[float] = None) -> MapLocationOut:
    return MapLocationOut(
        id=str(loc.id),
        name=loc.name,
        lat=loc.lat,
        lng=loc.lng,
        address=loc.address,
        city=loc.city,
        state=loc.state,
        country=loc.country,
        postal_code=loc.postal_code,
        location_type=loc.location_type,
        tags=loc.tags,
        pod_capacity=loc.pod_capacity,
        distance_km=distance_km
    )


def _require_verified(db: Session, user_id: str) -> MapPreference:
    """Ensure user has location access enabled"""
    pref = db.query(MapPreference).filter(MapPreference.user_id == user_id).first()
    if not pref or not pref.verified:
        raise HTTPException(
            status_code=403,
            detail="Location access disabled. Enable 'verify location' first."
        )
    return pref


# -----------------------------
# ROUTER
# -----------------------------
router = APIRouter(prefix="/maps", tags=["maps"])


@router.post("/verify-location")
def set_verify_location(payload: VerifyLocationIn, db: Session = Depends(get_db)):
    """Toggle location access for a user"""
    pref = db.query(MapPreference).filter(MapPreference.user_id == payload.user_id).first()
    if not pref:
        pref = MapPreference(user_id=payload.user_id, verified=payload.verify)
        db.add(pref)
    else:
        pref.verified = payload.verify
    db.commit()
    return {"ok": True, "user_id": payload.user_id, "verified": pref.verified}


@router.get("/verify-location")
def get_verify_location(user_id: str = Query(...), db: Session = Depends(get_db)):
    """Check if user has location access enabled"""
    pref = db.query(MapPreference).filter(MapPreference.user_id == user_id).first()
    return {"user_id": user_id, "verified": bool(pref and pref.verified)}


@router.post("/locate")
def save_location(payload: LocateIn, db: Session = Depends(get_db)):
    """Save user's current location"""
    _require_verified(db, payload.user_id)
    pref = db.query(MapPreference).filter(MapPreference.user_id == payload.user_id).first()
    if pref:
        pref.last_lat = payload.lat
        pref.last_lng = payload.lng
        db.commit()
    return {"ok": True, "user_id": payload.user_id, "lat": payload.lat, "lng": payload.lng}


@router.post("/ingest/geojson")
def ingest_geojson(fc: GeoJSONFeatureCollection, db: Session = Depends(get_db)):
    """Bulk import locations from GeoJSON (admin/system endpoint)"""
    if fc.type.lower() != "featurecollection":
        raise HTTPException(400, "Invalid GeoJSON type")

    created, updated = 0, 0
    for feat in fc.features:
        if feat.type.lower() != "feature" or feat.geometry.type.lower() != "point":
            continue
        if len(feat.geometry.coordinates) < 2:
            continue
            
        lng, lat = feat.geometry.coordinates[0], feat.geometry.coordinates[1]
        props = feat.properties or {}
        
        external_id = (props.get("external_id") or props.get("id") or "").strip() or None
        name = (props.get("name") or "").strip() or "Unnamed"
        
        # Try to find existing by external_id or name+coords
        existing = None
        if external_id:
            existing = db.query(MapLocation).filter(MapLocation.external_id == external_id).first()
        if not existing:
            existing = db.query(MapLocation).filter(
                MapLocation.name == name,
                MapLocation.lat == lat,
                MapLocation.lng == lng
            ).first()
        
        if existing:
            # Update existing
            existing.lat = lat
            existing.lng = lng
            existing.name = name or existing.name
            existing.address = props.get("address") or existing.address
            existing.city = props.get("city") or existing.city
            existing.state = props.get("state") or existing.state
            existing.country = props.get("country") or existing.country
            existing.postal_code = props.get("postal_code") or existing.postal_code
            existing.location_type = props.get("location_type") or existing.location_type
            existing.tags = props.get("tags") or existing.tags
            if "pod_capacity" in props and isinstance(props["pod_capacity"], int):
                existing.pod_capacity = props["pod_capacity"]
            updated += 1
        else:
            # Create new
            new_loc = MapLocation(
                external_id=external_id,
                source=props.get("source", "import"),
                name=name,
                address=props.get("address"),
                city=props.get("city"),
                state=props.get("state"),
                country=props.get("country"),
                postal_code=props.get("postal_code"),
                lat=lat,
                lng=lng,
                location_type=props.get("location_type"),
                tags=props.get("tags"),
                pod_capacity=props.get("pod_capacity")
            )
            db.add(new_loc)
            created += 1
    
    db.commit()
    return {"ok": True, "created": created, "updated": updated}


@router.get("/locations", response_model=List[MapLocationOut])
def list_locations(
    user_id: str = Query(...),
    q: Optional[str] = None,
    city: Optional[str] = None,
    location_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List locations (requires verified user)"""
    _require_verified(db, user_id)
    
    query = db.query(MapLocation)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(func.lower(MapLocation.name).like(like))
    if city:
        query = query.filter(func.lower(MapLocation.city) == city.lower())
    if location_type:
        query = query.filter(MapLocation.location_type == location_type)
    
    rows = query.order_by(MapLocation.created_at.desc()).limit(min(limit, 500)).all()
    return [_to_out(r) for r in rows]


@router.get("/near", response_model=List[MapLocationOut])
def near_locations(
    user_id: str = Query(...),
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(25.0),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """Find locations within radius (requires verified user)"""
    _require_verified(db, user_id)
    
    all_locs = db.query(MapLocation).all()
    scored = []
    for loc in all_locs:
        dist = _haversine_km(lat, lng, loc.lat, loc.lng)
        if dist <= radius_km:
            scored.append((dist, loc))
    
    scored.sort(key=lambda x: x[0])
    return [_to_out(loc, distance_km=dist) for dist, loc in scored[:limit]]

