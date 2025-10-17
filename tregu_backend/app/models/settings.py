from sqlalchemy import Column, Integer, String, Boolean
from app.db import Base

class SiteSettings(Base):
    __tablename__ = "site_settings"
    id = Column(Integer, primary_key=True)
    theme = Column(String(32), default="light")  # background settings/theme
    registrations_open = Column(Boolean, default=True)
