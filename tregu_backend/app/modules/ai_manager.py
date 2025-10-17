from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import uuid

# Import all module routers so AI manager can call them
from . import wms, tms, scm, oms, wcs_wes

router = APIRouter(prefix="/ai", tags=["ai-manager"])

# In-memory registry (just for demo — you can later hook this to Postgres)
DB: Dict[str, Any] = {
    "users": {},
    "orders": {},
    "shipments": {},
    "tasks": {},
    "waves": {}
}

def generate_account_number() -> str:
    """Generate a unique 9-digit account number for each user."""
    while True:
        num = str(uuid.uuid4().int)[0:9]  # take first 9 digits
        if num not in [u["account_number"] for u in DB["users"].values()]:
            return num

@router.post("/create_user")
def create_user(payload: Dict[str, Any]):
    """
    Create a new user profile with auto-generated account number.
    Example payload:
    {
        "name": "Alan",
        "email": "alan@example.com",
        "role": "buyer"   # or "seller"
    }
    """
    user_id = str(uuid.uuid4())
    acct_num = generate_account_number()
    user = {
        "id": user_id,
        "name": payload.get("name", ""),
        "email": payload.get("email", ""),
        "role": payload.get("role", "buyer"),
        "account_number": acct_num
    }
    DB["users"][user_id] = user
    return {"message": "User created", "user": user}

@router.get("/get_user/{user_id}")
def get_user(user_id: str):
    if user_id not in DB["users"]:
        raise HTTPException(404, "User not found")
    return DB["users"][user_id]

@router.post("/create_order")
def create_order(payload: Dict[str, Any]):
    """
    Create a new order and link it to buyer.
    Example payload:
    {
        "buyer_id": "user-uuid",
        "items": [{"sku":"ECO-BOTTLE","qty":2,"price":1299}]
    }
    """
    order_id = str(uuid.uuid4())
    buyer_id = payload["buyer_id"]
    if buyer_id not in DB["users"]:
        raise HTTPException(404, "Buyer not found")

    total = sum([item["qty"] * item["price"] for item in payload["items"]])
    order = {
        "id": order_id,
        "buyer_id": buyer_id,
        "items": payload["items"],
        "status": "new",
        "total": total
    }
    DB["orders"][order_id] = order
    return {"message": "Order created", "order": order}

@router.post("/ship_order")
def ship_order(payload: Dict[str, Any]):
    """
    Ship an order: creates a shipment record and updates status.
    Example payload:
    {
        "order_id": "order-uuid",
        "carrier": "UPS",
        "tracking": "1Z123456"
    }
    """
    order_id = payload["order_id"]
    if order_id not in DB["orders"]:
        raise HTTPException(404, "Order not found")

    shipment_id = str(uuid.uuid4())
    shipment = {
        "id": shipment_id,
        "order_id": order_id,
        "carrier": payload.get("carrier", "Unknown"),
        "tracking": payload.get("tracking", ""),
        "status": "created"
    }
    DB["shipments"][shipment_id] = shipment
    DB["orders"][order_id]["status"] = "shipped"
    return {"message": "Shipment created", "shipment": shipment}

@router.post("/create_task")
def create_task(payload: Dict[str, Any]):
    """
    Create a warehouse task (pick, pack, move).
    Example payload:
    { "order_id": "order-uuid", "type": "pick" }
    """
    task_id = str(uuid.uuid4())
    task = {
        "id": task_id,
        "order_id": payload.get("order_id"),
        "type": payload.get("type", "pick"),
        "status": "queued"
    }
    DB["tasks"][task_id] = task
    return {"message": "Task created", "task": task}

@router.post("/create_wave")
def create_wave(payload: Dict[str, Any]):
    """
    Create a wave with a list of tasks.
    Example payload:
    { "task_ids": ["task-uuid1","task-uuid2"] }
    """
    wave_id = str(uuid.uuid4())
    wave = {
        "id": wave_id,
        "task_ids": payload.get("task_ids", []),
        "status": "planned"
    }
    DB["waves"][wave_id] = wave
    return {"message": "Wave created", "wave": wave}
