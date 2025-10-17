# ORIGINAL for Tregu
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class CreateItemIn(BaseModel):
    sku: str
    qty: int

class CreateItemOut(BaseModel):
    id: str
    sku: str
    qty: int
    status: str

# NOTE: This is an in-memory demo. Wire to DB for real use.
_FAKE_DB: dict[str, dict] = {}

@router.post("", response_model=CreateItemOut)
def create_item(body: CreateItemIn):
    if body.qty < 0:
        raise HTTPException(status_code=400, detail="qty must be >= 0")
    if body.sku in (x["sku"] for x in _FAKE_DB.values()):
        raise HTTPException(status_code=409, detail="sku already exists")
    _id = str(uuid.uuid4())
    _FAKE_DB[_id] = {"id": _id, "sku": body.sku, "qty": body.qty, "status": "created"}
    return _FAKE_DB[_id]
