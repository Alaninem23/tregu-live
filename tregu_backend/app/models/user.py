from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    account_number = Column(String(16), unique=True, index=True, nullable=False)
    name = Column(String(200))
    phone = Column(String(50))
    company_name = Column(String(200))
    age = Column(String(8))
    gender = Column(String(50))
    state = Column(String(8))
    country = Column(String(80))
    zip = Column(String(20))
    ssn_last4 = Column(String(8))
    ssn_hash = Column(String(128))
    ein_tin_hash = Column(String(128))
    plan = Column(String(32))
    billing_cycle = Column(String(16))
    pm_brand = Column(String(32))
    pm_last4 = Column(String(8))
    pm_exp = Column(String(16))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
