# app/core/config.py
import os
from datetime import timedelta

SECRET_KEY = os.getenv("JWT_SECRET", "change-this-in-prod")
JWT_ALG = "HS256"

ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("ACCESS_MINUTES", "15")))
REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("REFRESH_DAYS", "14")))
