from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime
import uuid
from enum import Enum
from enum import Enum

class LocationType(str, Enum):
    COUNTRY = "country"
    REGION = "region"
    LOCALITY = "locality"
    ADDRESS = "address"
    POI = "poi"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "seller_admin"
    tenant_name: str = "default"

class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    tenant_id: uuid.UUID
    class Config:
        from_attributes = True

class SellerIn(BaseModel):
    name: str

class SellerOut(BaseModel):
    id: uuid.UUID
    name: str
    kyc_status: str
    tenant_id: uuid.UUID
    class Config:
        from_attributes = True

class ProductIn(BaseModel):
    seller_id: uuid.UUID
    name: str
    description: Optional[str] = None
    price_cents: int
    stock: int = 0

class ProductOut(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    name: str
    description: Optional[str] = None
    price_cents: int
    stock: int
    class Config:
        from_attributes = True

class BookingIn(BaseModel):
    pod_id: uuid.UUID
    seller_id: uuid.UUID
    start_date: date
    end_date: date

class BookingOut(BaseModel):
    id: uuid.UUID
    pod_id: uuid.UUID
    seller_id: uuid.UUID
    start_date: date
    end_date: date
    status: str
    class Config:
        from_attributes = True

class RequestLog(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    session_id: Optional[str] = None
    client_ip: str
    ip_hash: str
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    is_vpn_or_proxy: bool = False
    user_agent: Optional[str] = None
    method: str
    path: str
    status_code: Optional[int] = None
    response_time_ms: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True

class LocationSearchParams(BaseModel):
    """
    Comprehensive location search parameters
    Supports flexible, multi-dimensional querying
    """
    q: Optional[str] = None  # Query string
    types: Optional[List[LocationType]] = None  # Location type filters
    country: Optional[str] = None  # ISO country code
    lang: Optional[str] = Field(default='en', description='Preferred language')
    limit: Optional[int] = Field(default=50, le=50, ge=1)

class LocationReverseParams(BaseModel):
    """
    Reverse geocoding parameters
    """
    lat: float
    lon: float
    lang: Optional[str] = Field(default='en')

class NearbyLocationParams(BaseModel):
    """
    Nearby location search parameters
    """
    lat: float
    lon: float
    radius_km: Optional[float] = Field(default=10.0, le=100.0)
    types: Optional[List[LocationType]] = None
    limit: Optional[int] = Field(default=50, le=50, ge=1)
