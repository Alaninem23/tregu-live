from fastapi import APIRouter
import sqlite3
import os

router = APIRouter(prefix="/search", tags=["search"])

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()
if DATABASE_URL.startswith("sqlite:///"):
    rel = DATABASE_URL.replace("sqlite:///", "", 1)
    DB_PATH = os.path.abspath(os.path.join(ROOT_DIR, rel))
else:
    DB_PATH = os.path.join(ROOT_DIR, "tregu.db")

def db():
    conn = sqlite3.connect(DB_PATH, isolation_level=None)
    conn.row_factory = sqlite3.Row
    return conn

@router.get("")
def search(q: str = ""):
    nq = (q or "").strip().lower()
    sellers = []
    listings = []
    conn = db()
    try:
        if nq:
            # Search sellers (assuming users table has seller info)
            srows = conn.execute("SELECT * FROM users WHERE role='seller'").fetchall()
            for s in srows:
                hay = " ".join([s["company"] or "", s["name"] or "", s["email"] or ""]).lower()
                if nq in hay:
                    sellers.append({
                        "accountId": s["account_no"],
                        "email": s["email"],
                        "name": s["name"],
                        "companyName": s["company"],
                        "logoUrl": None,  # No logo in users table
                        "role": "seller",
                    })
            # For listings, since there's no listings table, return empty for now
            # In a real app, you'd have a listings table
            listings = []
        else:
            sellers = []
            listings = []
    finally:
        conn.close()
    return {"sellers": sellers, "listings": listings}
