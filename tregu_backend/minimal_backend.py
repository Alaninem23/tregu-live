import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Tregu Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock AI characters data
MOCK_CHARACTERS = [
    {
        "id": 1,
        "name": "Tregu Assistant",
        "avatar_url": "/avatars/tregu-assistant.png",
        "personality": "A helpful and knowledgeable assistant for the Tregu platform, specializing in inventory management, business operations, and user support.",
        "system_prompt": "You are Tregu Assistant, a helpful AI companion for the Tregu inventory management platform. You help users with inventory management, business operations, and provide general assistance. Be friendly, professional, and knowledgeable about inventory systems, business management, and the Tregu platform features.",
        "is_active": True
    },
    {
        "id": 2,
        "name": "Commerce Expert",
        "avatar_url": "/avatars/commerce-expert.png",
        "personality": "An expert in e-commerce, sales strategies, and business development with deep knowledge of market trends and customer behavior.",
        "system_prompt": "You are a Commerce Expert specializing in e-commerce strategies, sales optimization, and business growth. Provide insights on market trends, customer behavior, pricing strategies, and sales funnel optimization.",
        "is_active": True
    }
]

# Mock conversations data
MOCK_CONVERSATIONS = []

@app.get("/healthz")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}

@app.get("/ai/characters")
async def get_characters():
    """Get all AI characters"""
    return MOCK_CHARACTERS

@app.get("/ai/conversations")
async def get_conversations():
    """Get user conversations"""
    return MOCK_CONVERSATIONS

@app.post("/ai/conversations")
async def create_conversation(conversation_data: dict):
    """Create a new conversation"""
    conversation = {
        "id": len(MOCK_CONVERSATIONS) + 1,
        "user_id": conversation_data.get("user_id", 1),
        "character_id": conversation_data.get("character_id", 1),
        "title": conversation_data.get("title", "New Conversation"),
        "messages": [],
        "character": next((c for c in MOCK_CHARACTERS if c["id"] == conversation_data.get("character_id", 1)), MOCK_CHARACTERS[0]),
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-15T10:00:00Z"
    }
    MOCK_CONVERSATIONS.append(conversation)
    return conversation

@app.post("/ai/chat")
async def chat(chat_data: dict):
    """Handle chat messages with mock responses"""
    message = chat_data.get("message", "")
    character_id = chat_data.get("character_id", 1)

    # Get character info
    character = next((c for c in MOCK_CHARACTERS if c["id"] == character_id), MOCK_CHARACTERS[0])

    # Generate mock response based on character
    if character_id == 1:  # Tregu Assistant
        if "inventory" in message.lower():
            response = "I'd be happy to help you with inventory management! Could you tell me more about what specific aspect you'd like assistance with? I can help with stock tracking, reorder points, or inventory optimization strategies."
        elif "business" in message.lower():
            response = "As your Tregu Assistant, I'm here to support your business operations. Whether it's financial planning, customer management, or operational efficiency, I can provide guidance and best practices."
        else:
            response = f"Hello! I'm {character['name']}, your AI assistant. I see you said: '{message}'. How can I help you with your Tregu platform today?"
    else:  # Commerce Expert
        if "sales" in message.lower() or "commerce" in message.lower():
            response = "Excellent question about commerce! Based on current market trends, I recommend focusing on personalized customer experiences and data-driven sales strategies. What specific aspect of your sales process would you like to optimize?"
        elif "market" in message.lower():
            response = "Market analysis shows that customer-centric approaches are yielding the highest ROI. Consider implementing AI-powered personalization and predictive analytics in your sales funnel."
        else:
            response = f"Hi there! I'm {character['name']}, your commerce specialist. Regarding your message about '{message}', I'd love to provide some expert insights on e-commerce strategies and business growth."

    return {
        "response": response,
        "character_id": character_id,
        "timestamp": "2025-01-15T10:00:00Z"
    }

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    print("Starting minimal Tregu backend server on port 8010...")
    try:
        uvicorn.run(app, host="127.0.0.1", port=8010, log_level="info")
    except KeyboardInterrupt:
        print("Server stopped")
    except Exception as e:
        print(f"Error: {e}")