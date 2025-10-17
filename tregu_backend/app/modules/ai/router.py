from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["AI"])

class ChatTurn(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatTurn]
    avatar_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    avatar_id: Optional[str] = None

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # find the last user message
    text = ""
    for m in reversed(req.messages):
        role = (m.role or "").lower()
        if role == "user":
            text = m.content or ""
            break
    avatar = req.avatar_id or "assistant"
    # keep it simple; no f-strings to avoid quoting surprises
    reply = "Hi! I'm your Tregu assistant (" + avatar + "). You said: " + (text[:500] if text else "(say something!)")
    return ChatResponse(reply=reply, avatar_id=req.avatar_id)