from pydantic import BaseModel
import uuid
from typing import Optional

class StateResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    class Config:
        from_attributes = True

class CityResponse(BaseModel):
    id: uuid.UUID
    name: str
    state_id: uuid.UUID
    class Config:
        from_attributes = True

class ZipCodeResponse(BaseModel):
    id: uuid.UUID
    code: str
    city_id: uuid.UUID
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    class Config:
        from_attributes = True