# app/auth_deps.py
# Separate module for auth dependencies to avoid circular imports

from fastapi import Depends
from sqlalchemy.orm import Session
from .auth import get_current_user as _get_current_user, get_current_user_optional as _get_current_user_optional
from .db import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Re-export the auth functions
get_current_user = _get_current_user
get_current_user_optional = _get_current_user_optional