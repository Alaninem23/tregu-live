import os
from dotenv import load_dotenv
load_dotenv()

APP_NAME = os.getenv("APP_NAME", "Tregu API")
APP_ENV = os.getenv("APP_ENV", "local")
SECRET_KEY = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "change_me"))
JWT_ALG = os.getenv("JWT_ALG", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://tregu:tregu@localhost:5432/tregu")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
