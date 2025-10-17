from app.db import engine, Base
from app.models.ai_messenger import AICharacter, ChatConversation, ChatMessage

# Create AI tables
Base.metadata.create_all(bind=engine, tables=[AICharacter.__table__, ChatConversation.__table__, ChatMessage.__table__])
print("AI tables created successfully")