from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from ..db import Base

class Listing(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(String(120), index=True)
    seller_name = Column(String(200), index=True)
    title = Column(String(255), index=True)
    body = Column(Text, nullable=True)
    category = Column(String(120), nullable=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
