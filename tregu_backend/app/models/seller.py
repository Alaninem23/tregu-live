from sqlalchemy import Column, Integer, String
from ..db import Base

class Seller(Base):
    __tablename__ = "sellers"
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String(120), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    name = Column(String(200))
    company_name = Column(String(200))
    logo_url = Column(String(500))
