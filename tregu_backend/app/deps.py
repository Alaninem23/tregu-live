from app.db import SessionLocal
from sqlalchemy.orm import Session
from app.auth import get_current_user

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
