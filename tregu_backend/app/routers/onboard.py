from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os

router = APIRouter(prefix="/onboard", tags=["onboard"])

class ProfileIn(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    companyName: str = ""
    companyEmail: str = ""
    companyPhone: str = ""
    age: str = ""
    gender: str = ""
    avatarUrl: Optional[str] = None
    attachments: Optional[List[Dict[str, str]]] = []

class SellerIn(BaseModel):
    ein_or_ssn: str
    drivers_license: str
    business_name: str
    products_services: str
    website: Optional[str] = ""
    goals: Optional[str] = ""
    certificates: Optional[List[Dict[str, str]]] = []
    tier: str = "Basic"

class BuyerOnboardReq(BaseModel):
    user_id: str
    profile: ProfileIn

class SellerOnboardReq(BaseModel):
    user_id: str
    seller: SellerIn

@router.post("/buyer")
def onboard_buyer(req: BuyerOnboardReq):
    # TODO: write to DB, link user->profile, create default buyer roles/permissions,
    # create watchlist, notifications, payments profile, etc.
    if not req.user_id:
        raise HTTPException(400, "user_id required")
    return {
        "status": "ok",
        "user_id": req.user_id,
        "granted": [
            "browse_listings","bid","buy","order_tracking","contact_sellers",
            "leave_feedback","alerts","payments_supported"
        ]
    }

@router.post("/seller")
def onboard_seller(req: SellerOnboardReq):
    # TODO: persist sensitive fields encrypted-at-rest (do NOT log plaintext),
    # KYC/KYB checks, tax handling, payouts profile, etc.
    if not req.user_id:
        raise HTTPException(400, "user_id required")
    if req.seller.tier not in ("Basic","Gold","Platinum"):
        raise HTTPException(400, "invalid tier")
    # Provision modules according to tier
    tier = req.seller.tier
    modules = {
        "Basic":    ["OMS","SCM"],
        "Gold":     ["OMS","SCM","WMS","TMS"],
        "Platinum": ["OMS","SCM","WMS","TMS","WCS/WES"]
    }[tier]
    return {"status":"ok","user_id":req.user_id,"tier":tier,"modules":modules}
