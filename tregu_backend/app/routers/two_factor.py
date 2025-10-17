from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import select, update
import secrets
import string
import json
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta
from typing import Optional, List

from ..db import SessionLocal
from ..models import User, TwoFactorMethod, TwoFactorAttempt, SecurityEvent
from ..auth import get_current_user

router = APIRouter(prefix="/auth/2fa", tags=["2fa"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_backup_codes() -> List[str]:
    """Generate 10 backup codes"""
    codes = []
    for _ in range(10):
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        codes.append(code)
    return codes

def log_security_event(db: Session, user_id: str, event_type: str, description: str,
                      request: Request, is_suspicious: bool = False):
    """Log a security event"""
    event = SecurityEvent(
        user_id=user_id,
        event_type=event_type,
        description=description,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        is_suspicious=is_suspicious
    )
    db.add(event)
    db.commit()

# Pydantic models
class SetupTOTPRequest(BaseModel):
    phone_number: Optional[str] = None

class VerifyCodeRequest(BaseModel):
    code: str
    method_type: str = "totp"

class BackupCodeRequest(BaseModel):
    code: str

class TwoFactorMethodResponse(BaseModel):
    id: str
    method_type: str
    is_enabled: bool
    phone_number: Optional[str] = None
    has_secret: bool
    created_at: datetime

class SecurityEventResponse(BaseModel):
    id: str
    event_type: str
    description: str
    ip_address: Optional[str]
    is_suspicious: bool
    created_at: datetime

@router.get("/status")
def get_2fa_status(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get current 2FA status for user"""
    methods = db.query(TwoFactorMethod).filter(
        TwoFactorMethod.user_id == user.id,
        TwoFactorMethod.is_enabled == True
    ).all()

    return {
        "is_enabled": len(methods) > 0,
        "methods": [
            TwoFactorMethodResponse(
                id=str(m.id),
                method_type=m.method_type,
                is_enabled=m.is_enabled,
                phone_number=m.phone_number,
                has_secret=bool(m.secret),
                created_at=m.created_at
            ) for m in methods
        ]
    }

@router.post("/setup/totp")
def setup_totp(request: SetupTOTPRequest, db: Session = Depends(get_db),
               user: User = Depends(get_current_user), req: Request = None):
    """Setup TOTP 2FA method"""
    # Check if TOTP is already enabled
    existing = db.query(TwoFactorMethod).filter(
        TwoFactorMethod.user_id == user.id,
        TwoFactorMethod.method_type == "totp",
        TwoFactorMethod.is_enabled == True
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="TOTP already enabled")

    # Generate secret
    secret = pyotp.random_base32()

    # Create TOTP method
    method = TwoFactorMethod(
        user_id=user.id,
        method_type="totp",
        secret=secret,
        phone_number=request.phone_number,
        backup_codes=json.dumps(generate_backup_codes())
    )

    db.add(method)
    db.commit()
    db.refresh(method)

    # Generate QR code
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="Tregu")

    # Create QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_code_b64 = base64.b64encode(buffer.getvalue()).decode()

    log_security_event(db, str(user.id), "2fa_setup_started", "TOTP setup initiated", req)

    return {
        "method_id": str(method.id),
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_code_b64}",
        "backup_codes": json.loads(method.backup_codes)
    }

@router.post("/setup/sms")
def setup_sms(request: SetupTOTPRequest, db: Session = Depends(get_db),
              user: User = Depends(get_current_user), req: Request = None):
    """Setup SMS 2FA method"""
    if not request.phone_number:
        raise HTTPException(status_code=400, detail="Phone number required for SMS 2FA")

    # Check if SMS is already enabled
    existing = db.query(TwoFactorMethod).filter(
        TwoFactorMethod.user_id == user.id,
        TwoFactorMethod.method_type == "sms",
        TwoFactorMethod.is_enabled == True
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="SMS already enabled")

    # Create SMS method
    method = TwoFactorMethod(
        user_id=user.id,
        method_type="sms",
        phone_number=request.phone_number,
        backup_codes=json.dumps(generate_backup_codes())
    )

    db.add(method)
    db.commit()
    db.refresh(method)

    log_security_event(db, str(user.id), "2fa_setup_started", f"SMS setup initiated for {request.phone_number}", req)

    return {
        "method_id": str(method.id),
        "phone_number": request.phone_number,
        "backup_codes": json.loads(method.backup_codes)
    }

@router.post("/verify")
def verify_2fa_code(request: VerifyCodeRequest, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user), req: Request = None):
    """Verify 2FA code during setup"""
    method = db.query(TwoFactorMethod).filter(
        TwoFactorMethod.user_id == user.id,
        TwoFactorMethod.method_type == request.method_type,
        TwoFactorMethod.is_enabled == False  # Not yet enabled
    ).first()

    if not method:
        raise HTTPException(status_code=400, detail="No pending 2FA setup found")

    is_valid = False

    if request.method_type == "totp":
        if not method.secret:
            raise HTTPException(status_code=400, detail="TOTP secret not found")
        totp = pyotp.TOTP(method.secret)
        is_valid = totp.verify(request.code)
    elif request.method_type == "sms":
        # For demo purposes, accept any 6-digit code
        # In production, integrate with SMS service
        is_valid = len(request.code) == 6 and request.code.isdigit()

    if not is_valid:
        # Log failed attempt
        attempt = TwoFactorAttempt(
            user_id=user.id,
            method_type=request.method_type,
            code=request.code,
            is_successful=False,
            ip_address=req.client.host if req.client else None,
            user_agent=req.headers.get("user-agent")
        )
        db.add(attempt)
        db.commit()

        log_security_event(db, str(user.id), "2fa_verification_failed",
                          f"Failed {request.method_type} verification", req, True)
        raise HTTPException(status_code=400, detail="Invalid code")

    # Enable the method
    method.is_enabled = True
    method.last_used = datetime.utcnow()
    db.commit()

    # Log successful attempt
    attempt = TwoFactorAttempt(
        user_id=user.id,
        method_type=request.method_type,
        code=request.code,
        is_successful=True,
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent")
    )
    db.add(attempt)
    db.commit()

    log_security_event(db, str(user.id), "2fa_enabled",
                      f"{request.method_type.upper()} 2FA enabled", req)

    return {"success": True, "method_type": request.method_type}

@router.post("/authenticate")
def authenticate_2fa(request: VerifyCodeRequest, db: Session = Depends(get_db),
                    user: User = Depends(get_current_user), req: Request = None):
    """Authenticate with 2FA code during login"""
    method = db.query(TwoFactorMethod).filter(
        TwoFactorMethod.user_id == user.id,
        TwoFactorMethod.method_type == request.method_type,
        TwoFactorMethod.is_enabled == True
    ).first()

    if not method:
        raise HTTPException(status_code=400, detail="2FA method not found")

    is_valid = False

    if request.method_type == "totp":
        if not method.secret:
            raise HTTPException(status_code=400, detail="TOTP secret not found")
        totp = pyotp.TOTP(method.secret)
        is_valid = totp.verify(request.code)
    elif request.method_type == "sms":
        # For demo purposes, accept any 6-digit code
        is_valid = len(request.code) == 6 and request.code.isdigit()

    if not is_valid:
        # Check if it's a backup code
        backup_codes = json.loads(method.backup_codes or "[]")
        if request.code in backup_codes:
            # Remove used backup code
            backup_codes.remove(request.code)
            method.backup_codes = json.dumps(backup_codes)
            is_valid = True

    if not is_valid:
        # Log failed attempt
        attempt = TwoFactorAttempt(
            user_id=user.id,
            method_type=request.method_type,
            code=request.code,
            is_successful=False,
            ip_address=req.client.host if req.client else None,
            user_agent=req.headers.get("user-agent")
        )
        db.add(attempt)
        db.commit()

        log_security_event(db, str(user.id), "2fa_login_failed",
                          f"Failed {request.method_type} login attempt", req, True)
        raise HTTPException(status_code=400, detail="Invalid code")

    # Update last used
    method.last_used = datetime.utcnow()
    db.commit()

    # Log successful attempt
    attempt = TwoFactorAttempt(
        user_id=user.id,
        method_type=request.method_type,
        code=request.code,
        is_successful=True,
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent")
    )
    db.add(attempt)
    db.commit()

    log_security_event(db, str(user.id), "2fa_login_success",
                      f"Successful {request.method_type} login", req)

    return {"success": True, "method_type": request.method_type}

@router.post("/backup-codes/regenerate")
def regenerate_backup_codes(db: Session = Depends(get_db),
                           user: User = Depends(get_current_user), req: Request = None):
    """Regenerate backup codes"""
    methods = db.query(TwoFactorMethod).filter(
        TwoFactorMethod.user_id == user.id,
        TwoFactorMethod.is_enabled == True
    ).all()

    if not methods:
        raise HTTPException(status_code=400, detail="No 2FA methods enabled")

    new_codes = generate_backup_codes()

    for method in methods:
        method.backup_codes = json.dumps(new_codes)

    db.commit()

    log_security_event(db, str(user.id), "backup_codes_regenerated",
                      "Backup codes regenerated", req)

    return {"backup_codes": new_codes}

@router.delete("/method/{method_id}")
def disable_2fa_method(method_id: str, db: Session = Depends(get_db),
                      user: User = Depends(get_current_user), req: Request = None):
    """Disable a 2FA method"""
    method = db.query(TwoFactorMethod).filter(
        TwoFactorMethod.id == method_id,
        TwoFactorMethod.user_id == user.id
    ).first()

    if not method:
        raise HTTPException(status_code=404, detail="2FA method not found")

    method.is_enabled = False
    db.commit()

    log_security_event(db, str(user.id), "2fa_method_disabled",
                      f"{method.method_type.upper()} 2FA disabled", req)

    return {"success": True}

@router.get("/security-events")
def get_security_events(limit: int = 20, db: Session = Depends(get_db),
                       user: User = Depends(get_current_user)):
    """Get recent security events"""
    events = db.query(SecurityEvent).filter(
        SecurityEvent.user_id == user.id
    ).order_by(SecurityEvent.created_at.desc()).limit(limit).all()

    return {
        "events": [
            SecurityEventResponse(
                id=str(e.id),
                event_type=e.event_type,
                description=e.description,
                ip_address=e.ip_address,
                is_suspicious=e.is_suspicious,
                created_at=e.created_at
            ) for e in events
        ]
    }