# tregu_backend/app/routers/ai_helpdesk.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict

router = APIRouter(prefix="/ai", tags=["ai"])

class HelpDeskRequest(BaseModel):
    text: str
    user_id: Optional[str] = None
    tenant: Optional[str] = None
    confirm: Optional[bool] = False

class HelpDeskReply(BaseModel):
    answer: str
    sources: List[Dict] = []
    consulted: List[str] = []

@router.post("/helpdesk", response_model=HelpDeskReply)
def helpdesk(req: HelpDeskRequest):
    t = (req.text or "").strip().lower()
    if not t:
        raise HTTPException(status_code=400, detail="text required")

    # Super-simple intent router so you ALWAYS get a reply (for wiring tests).
    if "list product" in t or "list products" in t:
        # Try hitting your local /products; don't crash if it fails.
        try:
            import requests
            r = requests.get("http://localhost:8000/products", timeout=2)
            if r.ok:
                prods = r.json()
                names = ", ".join([p.get("name","(no name)") for p in prods[:5]]) or "none"
                return HelpDeskReply(
                    answer=f"I found these products: {names}.",
                    sources=[{"type":"internal","endpoint":"/products"}],
                    consulted=["products"]
                )
        except Exception:
            pass
        return HelpDeskReply(answer="I tried to list products but couldn’t reach /products.", consulted=["products"])

    if "help" in t or "what can you do" in t:
        return HelpDeskReply(
            answer=(
                "I’m the Tregu Help Desk. Try:\n"
                "• “List products”\n"
                "• “How do I add a product?”\n"
                "• “Explain OMS vs WMS”\n"
                "• “Propose upgrade to add image uploads.”"
            )
        )

    # Default fallback
    return HelpDeskReply(
        answer=f"I received: “{req.text}”. I’m ready—ask me to ‘List products’, or ‘Explain WMS’, or ‘Propose an upgrade’.",
        consulted=[]
    )
