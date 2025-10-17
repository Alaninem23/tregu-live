# app/routers/dashboard.py  (ORIGINAL for Tregu)
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.routers.auth import get_current_user  # re-use your auth dependency
from app.models.user import User

router = APIRouter()

class NextPageOut(BaseModel):
    role: str
    next_path: str
    message: str

class MenuItem(BaseModel):
    label: str
    path: str

class MenuOut(BaseModel):
    role: str
    items: list[MenuItem]

@router.get("/next", response_model=NextPageOut)
def next_page(current: User = Depends(get_current_user)):
    """
    Decide the very next screen the user should see after signup/login.
    You can expand this to check onboarding flags later.
    """
    role = (current.role or "buyer").lower()
    if role == "seller":
        return {
            "role": role,
            "next_path": "/seller/dashboard",
            "message": "Welcome seller! Add your first product to get listed."
        }
    if role == "admin":
        return {
            "role": role,
            "next_path": "/admin",
            "message": "Welcome admin! Review reports and manage users."
        }
    # default: buyer
    return {
        "role": role,
        "next_path": "/market",
        "message": "Welcome! Start browsing the marketplace."
    }

@router.get("/menu", response_model=MenuOut)
def role_menu(current: User = Depends(get_current_user)):
    """
    Minimal role-based nav for your frontend header/side menu.
    """
    role = (current.role or "buyer").lower()

    if role == "seller":
        items = [
            {"label": "Dashboard", "path": "/seller/dashboard"},
            {"label": "Products",  "path": "/seller/products"},
            {"label": "Orders",    "path": "/seller/orders"},
            {"label": "Payouts",   "path": "/seller/payouts"},
            {"label": "Settings",  "path": "/settings"},
        ]
    elif role == "admin":
        items = [
            {"label": "Admin Home", "path": "/admin"},
            {"label": "Users",      "path": "/admin/users"},
            {"label": "Sellers",    "path": "/admin/sellers"},
            {"label": "Reports",    "path": "/admin/reports"},
            {"label": "Settings",   "path": "/settings"},
        ]
    else:  # buyer
        items = [
            {"label": "Market",   "path": "/market"},
            {"label": "Cart",     "path": "/cart"},
            {"label": "Orders",   "path": "/orders"},
            {"label": "Profile",  "path": "/settings"},
        ]

    return {"role": role, "items": items}
