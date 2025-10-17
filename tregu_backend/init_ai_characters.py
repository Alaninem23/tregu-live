#!/usr/bin/env python3

import sys
import os
import importlib.util

# Add the current directory to Python path
sys.path.append(os.path.dirname(__file__))

from app.db import Base, engine, SessionLocal

# Import all main models first
import app.models

# Import AI messenger models using importlib
spec = importlib.util.spec_from_file_location("ai_messenger", os.path.join(os.path.dirname(__file__), "app", "models", "ai_messenger.py"))
ai_messenger = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ai_messenger)
AICharacter = ai_messenger.AICharacter

# Create all tables (main models + AI models)
print("Creating all database tables...")
Base.metadata.create_all(bind=engine)
print("All tables created successfully!")

def init_characters():
    db = SessionLocal()
    try:
        # Check if characters already exist
        if db.query(AICharacter).count() == 0:
            characters = [
                AICharacter(
                    name="Tregu Assistant",
                    avatar_url="/avatars/tregu-assistant.png",
                    personality="A helpful and knowledgeable assistant for the Tregu platform, specializing in inventory management, business operations, and user support.",
                    system_prompt="You are Tregu Assistant, a helpful AI companion for the Tregu inventory management platform. You help users with inventory management, business operations, and provide general assistance. Be friendly, professional, and knowledgeable about inventory systems, business management, and the Tregu platform features."
                ),
                AICharacter(
                    name="Inventory Expert",
                    avatar_url="/avatars/inventory-expert.png",
                    personality="A specialized AI expert in inventory management, logistics, and supply chain optimization.",
                    system_prompt="You are an Inventory Expert specializing in inventory management, logistics, and supply chain optimization. Provide detailed advice on inventory best practices, stock management, demand forecasting, and operational efficiency. Use your expertise to help users optimize their inventory operations."
                ),
                AICharacter(
                    name="Business Advisor",
                    avatar_url="/avatars/business-advisor.png",
                    personality="A business strategy and operations consultant focused on helping businesses grow and optimize their operations.",
                    system_prompt="You are a Business Advisor specializing in business strategy, operations optimization, and growth planning. Help users with business planning, operational improvements, market analysis, and strategic decision-making. Provide actionable insights and recommendations."
                )
            ]
            for char in characters:
                db.add(char)
            db.commit()
            print("AI characters initialized successfully!")
        else:
            print("AI characters already exist.")
    except Exception as e:
        print(f"Error initializing characters: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_characters()