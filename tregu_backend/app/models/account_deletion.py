from sqlalchemy import Column, Integer, DateTime, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..db import Base

class AccountDeletion(Base):
    __tablename__ = "account_deletions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    requested_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    purge_after = Column(DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(days=30))
    status = Column(String, nullable=False, default="pending")
    reason = Column(String, nullable=True)
    user = relationship("User")
    __table_args__ = (UniqueConstraint('user_id', 'status', name='uq_user_pending'),)
