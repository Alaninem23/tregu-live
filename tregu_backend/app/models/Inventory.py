# ORIGINAL for Tregu
from sqlalchemy import Column, String, Integer, DateTime, func
from app.db import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = Column(String, primary_key=True)
    sku = Column(String, index=True, nullable=False, unique=True)
    qty = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)
