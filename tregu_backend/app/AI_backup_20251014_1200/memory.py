# tregu_backend/app/ai/memory.py
from __future__ import annotations
import uuid
from typing import List, Dict, Any
from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, Session

BaseMem = declarative_base()

class AIMessage(BaseMem):
    __tablename__ = "ai_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String, nullable=False)         # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    user_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AIFact(BaseMem):
    __tablename__ = "ai_facts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AIMemory:
    def create_tables(self, engine):
        BaseMem.metadata.create_all(bind=engine)

    def log_message(self, session: Session, role: str, content: str, user_id: str | None) -> uuid.UUID:
        m = AIMessage(role=role, content=content, user_id=user_id)
        session.add(m)
        session.flush()
        return m.id

    def recall_recent(self, session: Session, limit: int = 6) -> List[Dict[str, Any]]:
        rows = session.query(AIMessage).order_by(AIMessage.created_at.desc()).limit(limit).all()
        return [{"role": r.role, "content": r.content, "at": r.created_at.isoformat()} for r in reversed(rows)]
