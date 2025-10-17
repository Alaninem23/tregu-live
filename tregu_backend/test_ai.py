from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

# Test health endpoint
response = client.get("/healthz")
print("Health response:", response.json())

# Debug: check users in database
from app.db import SessionLocal
from app.models import User
db = SessionLocal()
users = db.query(User).all()
print("Users in database:", [(u.email, u.password_hash[:20]) for u in users])
db.close()

# Test login
response = client.post("/api/auth/login", json={"email": "admin@tregu.com", "password": "Admin123!"})
print("Login response:", response.status_code, response.json())

if response.status_code == 200:
    token = response.json()["access_token"]
    print("Login successful, token:", token[:50] + "...")

    # Test a simple auth endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    print("Me response:", response.status_code, response.json())

    # Test characters endpoint
    response = client.get("/api/ai/characters", headers=headers)
    print("Characters response:", response.status_code, response.json())

    # Test creating a character
    character_data = {
        "name": "Test Character",
        "description": "A test AI character",
        "personality": "Friendly and helpful",
        "system_prompt": "You are a helpful assistant."
    }
    response = client.post("/api/ai/characters", json=character_data, headers=headers)
    print("Create character response:", response.status_code, response.json())
    
    if response.status_code == 200:
        character_id = response.json()["id"]
        
        # Test updating the character
        update_data = {
            "name": "Updated Test Character",
            "personality": "Very friendly and helpful",
            "system_prompt": "You are a very helpful assistant."
        }
        response = client.put(f"/api/ai/characters/{character_id}", json=update_data, headers=headers)
        print("Update character response:", response.status_code, response.json())
        
        # Test deleting the character
        response = client.delete(f"/api/ai/characters/{character_id}", headers=headers)
        print("Delete character response:", response.status_code, response.json())