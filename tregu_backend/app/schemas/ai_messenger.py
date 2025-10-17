from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AICharacterBase(BaseModel):
    name: str
    avatar_url: Optional[str] = None
    personality: str
    system_prompt: str
    is_active: bool = True

class AICharacterCreate(AICharacterBase):
    pass

class AICharacter(AICharacterBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatMessage(ChatMessageBase):
    id: int
    conversation_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatConversationBase(BaseModel):
    character_id: int
    title: Optional[str] = None

class ChatConversationCreate(ChatConversationBase):
    pass

class ChatConversation(ChatConversationBase):
    id: int
    user_id: int
    messages: List[ChatMessage] = []
    character: AICharacter
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    character_id: int = 1  # Default character

class ChatResponse(BaseModel):
    reply: str
    conversation_id: Optional[int] = None
    character_name: str
    avatar_url: Optional[str] = None