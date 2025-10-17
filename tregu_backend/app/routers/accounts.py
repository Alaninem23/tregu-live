# tregu_backend/app/routes/accounts.py
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_session
from app.modules.ai_sql_models import (
    Tenant, User, UserAccountNumber,
    assign_account_number_once
)

router = APIRouter(tags=["users", "account-number"])

# ------------ Models ------------

class CompanyIn(BaseModel):
    name: Optional[str] = ""
    email: Optional[EmailStr] = None
    phone: Optional[str] = ""

class UpsertUserIn(BaseModel):
    user_id: str                 # we use email as a logical handle here
    email: EmailStr
    name: str
    phone: Optional[str] = ""
    company: Optional[CompanyIn] = None
    profile: Optional[dict] = None
    tenant_name: Optional[str] = "tregu-demo"

# ------------ Users ------------

@router.post("/users/upsert")
def upsert_user(payload: UpsertUserIn, session: Session = get_session()):
    """
    Upserts a user under a tenant. If tenant doesn't exist, create it.
    """
    # 1) tenant
    tenant = session.execute(
        select(Tenant).where(Tenant.name == payload.tenant_name)
    ).scalar_one_or_none()
    if not tenant:
        tenant = Tenant(name=payload.tenant_name)
        session.add(tenant)
        session.flush()

    # 2) user
    user = session.execute(
        select(User).where(User.tenant_id == tenant.id, User.email == str(payload.email))
    ).scalar_one_or_none()

    if not user:
        user = User(
            tenant_id=tenant.id,
            email=str(payload.email),
            name=payload.name or "",
            phone=payload.phone or ""
        )
        session.add(user)
    else:
        # update a few basics
        user.name = payload.name or user.name
        if payload.phone:
            user.phone = payload.phone

    session.flush()  # user.id available
    session.commit()

    return {"ok": True, "tenant_id": str(tenant.id), "user_id": str(user.id)}

# ------------ Account Numbers ------------

@router.get("/account-number/me")
def account_me(
    user_id: str = Query(..., description="email used as user handle"),
    reveal: bool = Query(False),
    session: Session = get_session(),
):
    """
    Returns masked account number for the given user_id (email).
    For security, this endpoint NEVER returns the full number to browsers.
    """
    user = session.execute(select(User).where(User.email == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "user not found")

    acc = session.get(UserAccountNumber, user.id)
    if not acc:
        return {"masked": None}

    num = acc.account_number
    masked = f"•••-•••-{num[-3:]}"
    return {"masked": masked}

@router.post("/account-number/assign")
def account_assign(body: dict, session: Session = get_session()):
    """
    Ensures the user has a 9-digit account number. Idempotent.
    Body: { "user_id": "<email>" }
    """
    email = (body or {}).get("user_id", "").strip()
    if not email:
        raise HTTPException(400, "user_id required")

    user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "user not found")

    num = assign_account_number_once(session, user.id)
    session.commit()

    masked = f"•••-•••-{num[-3:]}"
    return {"ok": True, "masked": masked}
