from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from ..deps import get_db, get_current_user
from ..db_models import User, RequestLog
from ..models import SiteSettings
from ..schemas.admin import RoleUpdate, SettingsUpdate
from .. import api_schemas
RequestLogSchema = api_schemas.RequestLog

router = APIRouter(prefix="/admin", tags=["Admin"])

def ensure_admin(u: User):
    if u.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

@router.post("/users/{user_id}/role")
def set_role(user_id: int, data: RoleUpdate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    db.add(user); db.commit()
    return {"ok": True, "user_id": user.id, "new_role": user.role}

@router.get("/settings")
def get_settings(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current)
    # TODO: Implement SiteSettings model
    return {"theme": "default", "registrations_open": True}

@router.post("/settings")
def update_settings(data: SettingsUpdate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current)
    # TODO: Implement SiteSettings model
    return {"ok": True, "theme": data.theme or "default", "registrations_open": data.registrations_open if data.registrations_open is not None else True}

@router.get("/stats")
def get_system_stats(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current)
    total_users = db.query(User).count()
    # For now, we'll use placeholder values since Tenant and AccountDeletion models may not exist
    total_tenants = 0  # Placeholder - would need Tenant model
    active_sessions = 0  # Placeholder - would need session tracking
    pending_deletions = 0  # Placeholder - would need AccountDeletion model

    return {
        "total_users": total_users,
        "total_tenants": total_tenants,
        "active_sessions": active_sessions,
        "pending_deletions": pending_deletions
    }

@router.get("/users")
def get_all_users(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current)
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "tenant_id": None,  # Placeholder since no tenant_id field exists
            "created_at": user.created_at.isoformat() if user.created_at else None
        } for user in users
    ]

@router.get("/tenants")
def get_all_tenants(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current)
    # Placeholder - would need Tenant model implementation
    return []

@router.get("/request-logs", response_model=List[RequestLogSchema])
def get_request_logs(
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    country: Optional[str] = Query(None, description="Filter by country"),
    region: Optional[str] = Query(None, description="Filter by region/state"),
    city: Optional[str] = Query(None, description="Filter by city"),
    postal_code: Optional[str] = Query(None, description="Filter by postal code"),
    include_unknown: bool = Query(True, description="Include records without geodata"),
    limit: int = Query(100, description="Maximum number of results", le=1000),
    offset: int = Query(0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin endpoint to query request logs with location filtering"""
    # Check if user is admin
    if current_user.role not in ['admin', 'security_admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = db.query(RequestLog)
    
    # Date filtering
    if start_date:
        query = query.filter(RequestLog.created_at >= start_date)
    if end_date:
        query = query.filter(RequestLog.created_at <= end_date)
    
    # User filtering
    if user_id:
        query = query.filter(RequestLog.user_id == user_id)
    
    # Location filtering with hierarchy
    filters = []
    
    if country:
        filters.append(RequestLog.country == country)
    
    if region:
        filters.append(RequestLog.region == region)
    
    if city:
        filters.append(RequestLog.city == city)
    
    if postal_code:
        # Allow prefix matching for postal codes
        filters.append(RequestLog.postal_code.like(f"{postal_code}%"))
    
    if filters:
        query = query.filter(and_(*filters))
    
    # Handle unknown locations
    if not include_unknown:
        query = query.filter(
            and_(
                RequestLog.country.isnot(None),
                RequestLog.region.isnot(None),
                RequestLog.city.isnot(None)
            )
        )
    
    # Order by most recent first
    query = query.order_by(RequestLog.created_at.desc())
    
    # Pagination
    results = query.offset(offset).limit(limit).all()
    
    return results

@router.get("/request-logs/stats")
def get_request_log_stats(
    days: int = Query(30, description="Number of days to look back"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics about request logs"""
    if current_user.role not in ['admin', 'security_admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    since_date = datetime.utcnow() - timedelta(days=days)
    
    # Basic stats
    total_requests = db.query(RequestLog).filter(RequestLog.created_at >= since_date).count()
    
    # Top countries
    top_countries = db.query(
        RequestLog.country,
        db.func.count(RequestLog.id).label('count')
    ).filter(
        and_(
            RequestLog.created_at >= since_date,
            RequestLog.country.isnot(None)
        )
    ).group_by(RequestLog.country).order_by(db.desc('count')).limit(10).all()
    
    # VPN/Proxy detection
    vpn_requests = db.query(RequestLog).filter(
        and_(
            RequestLog.created_at >= since_date,
            RequestLog.is_vpn_or_proxy == True
        )
    ).count()
    
    return {
        "total_requests": total_requests,
        "top_countries": [{"country": c[0], "count": c[1]} for c in top_countries],
        "vpn_proxy_requests": vpn_requests,
        "period_days": days
    }
