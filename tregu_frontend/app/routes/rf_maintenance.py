from fastapi import APIRouter, Depends
from app.security.authz import require_system

router = APIRouter(prefix="/api/rf", tags=["RF Maintenance"])

@router.get("/devices")
def list_devices(_=Depends(require_system("rf","read.rf"))):
    return {"ok": True, "resource": "rf.devices"}

@router.post("/users")
def create_rf_user(_=Depends(require_system("rf","write.rf"))):
    return {"ok": True, "resource": "rf.users.create"}
