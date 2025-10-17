# tregu_backend/app/routes/users.py
from __future__ import annotations
from typing import Optional
import uuid

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..db import get_session  # you should already have a session dependency
from ..modules.ai_sql_models import (
    Tenant, User, UserAccountNumber,
    assign_account_number_once
)

router = APIRouter(prefix="/users", tags=["users"])

class CompanyIn(BaseModel):
    name: Optional[str] = ""
    email: Optional[EmailStr] = None
    phone: Optional[str] = ""

class UpsertUserIn(BaseModel):
    user_id: str   # we use email as logical id here
    email: EmailStr
    name: str
    phone: Optional[str] = ""
    company: Optional[CompanyIn] = None
    profile: Optional[dict] = None
    tenant_name: Optional[str] = "tregu-demo"

@router.post("/upsert")
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
        user = User(tenant_id=tenant.id, email=str(payload.email), name=payload.name or "", phone=payload.phone or "")
        session.add(user)
    else:
        user.name = payload.name or user.name
        user.phone = payload.phone or user.phone

    session.flush()  # user.id available

    # (optional) you could persist profile JSON somewhere (not required for account number)
    # e.g., a separate table or key-value store

    session.commit()
    return {"ok": True, "tenant_id": str(tenant.id), "user_id": str(user.id)}
