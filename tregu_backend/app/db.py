from __future__ import annotations
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load .env automatically
try:
    from dotenv import load_dotenv  # python-dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
except Exception:
    # Safe to continue if python-dotenv isn't installed; we can still rely on process env
    pass

log = logging.getLogger("tregu.db")
logging.basicConfig(level=logging.INFO)

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    # Fallback to local SQLite for dev/smoke without Postgres
    default_sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tregu.db"))
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{default_sqlite_path}"
    log.warning(
        "DATABASE_URL not set; using SQLite fallback at %s. For Postgres, set DATABASE_URL.",
        default_sqlite_path,
    )

def _mask(url: str) -> str:
    try:
        if "://" in url and "@" in url:
            head, tail = url.split("://", 1)
            creds, rest = tail.split("@", 1)
            return f"{head}://***:***@{rest}"
    except Exception:
        pass
    return url

log.info("Connecting DB %s", _mask(SQLALCHEMY_DATABASE_URL))

# Configure engine; for SQLite add check_same_thread=False
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
