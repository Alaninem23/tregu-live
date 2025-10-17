# tregu_backend/app/seed.py
from sqlalchemy.orm import Session
from app.models import User, Tenant, State, City, ZipCode
from app.auth import hash_password

# Import AI messenger models
import importlib.util
import os
spec = importlib.util.spec_from_file_location("ai_messenger", os.path.join(os.path.dirname(__file__), "models", "ai_messenger.py"))
ai_messenger = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ai_messenger)
AICharacter = ai_messenger.AICharacter

def seed_initial_data(db: Session):
    """
    Idempotent seeding: run safely on every startup.
    Creates Admin / Seller / Buyer accounts if they don't exist.
    Passwords are for DEV ONLY. Change in prod.
    """
    # Create default tenant if it doesn't exist
    tenant = db.query(Tenant).first()
    if not tenant:
        tenant = Tenant(name="Default Tenant")
        db.add(tenant)
        db.commit()
        db.refresh(tenant)

    seeds = [
        {"email": "admin@tregu.com",  "role": "admin",  "password": "Admin123!"},
        {"email": "seller@tregu.com", "role": "seller", "password": "Admin123!"},
        {"email": "buyer@tregu.com",  "role": "buyer",  "password": "Admin123!"},
    ]

    existing = {u.email for u in db.query(User).all()}

    for s in seeds:
        if s["email"] in existing:
            continue

        u = User(
            tenant_id=tenant.id,
            email=s["email"],
            password_hash=hash_password(s["password"]),
            role=s["role"],
        )
        db.add(u)

    # Seed locations if not exist
    if not db.query(State).first():
        # Sample US states
        states_data = [
            {"name": "California", "code": "CA"},
            {"name": "Texas", "code": "TX"},
            {"name": "New York", "code": "NY"},
            {"name": "Florida", "code": "FL"},
        ]
        for state_data in states_data:
            state = State(name=state_data["name"], code=state_data["code"])
            db.add(state)
            db.flush()  # to get id
            # Add sample cities
            if state_data["code"] == "CA":
                cities = ["Los Angeles", "San Francisco", "San Diego"]
            elif state_data["code"] == "TX":
                cities = ["Houston", "Dallas", "Austin"]
            elif state_data["code"] == "NY":
                cities = ["New York City", "Buffalo", "Albany"]
            elif state_data["code"] == "FL":
                cities = ["Miami", "Orlando", "Tampa"]
            for city_name in cities:
                city = City(name=city_name, state_id=state.id)
                db.add(city)
                db.flush()
                # Add sample zip
                zip_code = ZipCode(code=f"{10000 + hash(city_name) % 90000}", city_id=city.id)
                db.add(zip_code)

    # Seed AI characters if not exist
    if not db.query(AICharacter).first():
        ai_characters = [
            {
                "name": "Tregu Assistant",
                "avatar_url": "/ai-avatar-1.png",
                "personality": "A helpful and knowledgeable assistant for Tregu commerce platform. I can help with product recommendations, seller information, and general marketplace questions.",
                "system_prompt": "You are Tregu Assistant, a helpful AI assistant for the Tregu commerce platform. You help users with product recommendations, seller information, marketplace navigation, and general questions about commerce. Be friendly, knowledgeable, and focused on commerce-related topics. Keep responses concise but informative."
            },
            {
                "name": "Commerce Expert",
                "avatar_url": "/ai-avatar-2.png",
                "personality": "An expert in business commerce, supply chain, and marketplace operations. I provide insights on business strategies and operational efficiency.",
                "system_prompt": "You are Commerce Expert, an AI specialist in business commerce and marketplace operations. You provide expert advice on supply chain management, business strategies, operational efficiency, and marketplace best practices. Be professional, insightful, and data-driven in your responses."
            },
            {
                "name": "Market Analyst",
                "avatar_url": "/ai-avatar-3.png",
                "personality": "A data-driven market analyst who provides insights on trends, pricing, and market opportunities within the Tregu platform.",
                "system_prompt": "You are Market Analyst, an AI focused on market trends and data analysis. You help users understand market dynamics, pricing strategies, demand patterns, and business opportunities. Provide data-driven insights and actionable recommendations."
            }
        ]

        for char_data in ai_characters:
            character = AICharacter(
                name=char_data["name"],
                avatar_url=char_data["avatar_url"],
                personality=char_data["personality"],
                system_prompt=char_data["system_prompt"],
                is_active=True
            )
            db.add(character)

    db.commit()
