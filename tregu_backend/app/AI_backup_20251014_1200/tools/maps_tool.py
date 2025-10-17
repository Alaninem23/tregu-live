# tregu_backend/app/ai/tools/maps_tool.py
from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from ...modules.maps import MapLocation
import math

def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0088
    import math
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def find_locations(
    db: Session, q: Optional[str]=None, near_lat: Optional[float]=None, near_lng: Optional[float]=None,
    radius_km: float = 25.0, limit: int = 20
) -> List[Dict[str, Any]]:
    qs = db.query(MapLocation)
    if q:
        qs = qs.filter(func.lower(MapLocation.name).like(f"%{q.lower()}%"))
    rows = qs.all()

    # If near_ provided, do a distance filter in Python for simplicity
    if near_lat is not None and near_lng is not None:
        scored = []
        for r in rows:
            d = _haversine_km(near_lat, near_lng, r.lat, r.lng)
            if d <= radius_km:
                scored.append((d, r))
        scored.sort(key=lambda x: x[0])
        rows = [r for _, r in scored]

    out = []
    for r in rows[:limit]:
        out.append({
            "id": str(r.id),
            "name": r.name,
            "lat": r.lat,
            "lng": r.lng,
            "address": r.address,
            "city": r.city,
            "state": r.state,
            "country": r.country,
            "location_type": r.location_type,
            "tags": r.tags,
            "pod_capacity": r.pod_capacity,
        })
    return out
