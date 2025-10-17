from pydantic import BaseModel
from datetime import datetime

class PostCreate(BaseModel):
    title: str
    body: str

class PostOut(BaseModel):
    id: int
    title: str
    body: str
    created_at: datetime
    seller_name: str
