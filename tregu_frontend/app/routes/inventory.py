from fastapi import APIRouter, Depends
from app.security.authz import require_system

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("/overview")
def overview(_=Depends(require_system("inventory","read.inventory"))):
    return {"ok": True, "resource": "inventory.overview"}

@router.post("/adjustments")
def adjustments(_=Depends(require_system("inventory","write.inventory"))):
    return {"ok": True, "resource": "inventory.adjustments"}
