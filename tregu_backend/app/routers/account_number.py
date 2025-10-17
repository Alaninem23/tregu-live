import os
import random
from typing import Optional

from fastapi import APIRouter, HTTPException, Body, Header, Query
import psycopg2
import psycopg2.extras

from .routers import account_number as account_number_router
app.include_router(account_number_router.router)

router = APIRouter(prefix="/account-number", tags=["account-number"])

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("DB_URL")
if not DATABASE_URL:
    # Ex: postgresql://tregu:tregu@db:5432/tregu
    DATABASE_URL = "postgresql://tregu:tregu@db:5432/tregu"

def get_conn():
    return psycopg2.connect(DATABASE_URL)

def ensure_table():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS user_account_numbers (
                user_id TEXT PRIMARY KEY,
                account_number CHAR(9) UNIQUE NOT NULL
            );
            """)
            conn.commit()

def generate_9_digit() -> str:
    # 9-digit numeric string from 100000000..999999999 (leading zero avoided for readability)
    return str(random.randint(100_000_000, 999_999_999))

def mask(num: str) -> str:
    # show last 3 digits only
    return "***-***-" + num[-3:]

@router.post("/assign")
def assign_account_number(
    user_id: str = Body(..., embed=True),
    x_admin: Optional[str] = Header(None)  # "true" if an admin is calling (simple demo)
):
    """
    Assign a unique 9-digit account number to the user *once*.
    Returns masked by default; if the caller is the same user (or admin), you can also reveal.
    """
    ensure_table()
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # Already assigned?
            cur.execute("SELECT account_number FROM user_account_numbers WHERE user_id=%s", (user_id,))
            row = cur.fetchone()
            if row:
                acct = row["account_number"]
                return {"status": "exists", "masked": mask(acct)}

            # Generate unique with retry on collisions (very rare)
            for _ in range(10):
                candidate = generate_9_digit()
                try:
                    cur.execute(
                        "INSERT INTO user_account_numbers(user_id, account_number) VALUES(%s,%s)",
                        (user_id, candidate)
                    )
                    conn.commit()
                    return {"status": "created", "masked": mask(candidate)}
                except psycopg2.Error as e:
                    conn.rollback()
                    # if unique violation, try again; else raise
                    if e.pgcode != "23505":  # unique_violation
                        raise

            raise HTTPException(500, "Could not generate a unique account number after several attempts")

@router.get("/me")
def get_my_account_number(
    user_id: str = Query(...),
    reveal: bool = Query(False),
    x_admin: Optional[str] = Header(None)
):
    """
    Get your account number.
    - By default returns masked (***-***-123).
    - If reveal=true AND caller is the same user or admin, return full number.
      (Demo auth: we trust the user_id passed here; in production, use real auth.)
    """
    ensure_table()
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT account_number FROM user_account_numbers WHERE user_id=%s", (user_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "No account number assigned")
            acct = row["account_number"]
            if reveal and (x_admin == "true"):
                # Admin reveal (for demo). For per-user reveal, enforce real auth/session.
                return {"account_number": acct, "masked": mask(acct), "revealed": True}
            # Default: masked
            return {"masked": mask(acct), "revealed": False}


