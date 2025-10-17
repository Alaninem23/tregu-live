from fastapi import APIRouter, Depends
from app.security.authz import require_system

router = APIRouter(prefix="/api/finance", tags=["Finance"])

@router.get("/overview")
def overview(_=Depends(require_system("finance","read.finance"))):
    return {"ok": True, "resource": "finance.overview"}
