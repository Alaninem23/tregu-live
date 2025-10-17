# Safe, explicit tools the AI can use inside your ERP.
# Wire these to your existing services or API routes as needed.

from typing import Dict, Any, Optional, List
import requests, os

API_BASE = os.getenv("AI_TOOL_API_BASE", "http://api:8000")  # internal when running via docker
PUBLIC_API = os.getenv("AI_PUBLIC_API", "http://localhost:8000")  # when testing outside docker

class ToolContext:
    def __init__(self, user_id: Optional[str], tenant: Optional[str], bearer_token: Optional[str], user_confirmed: bool):
        self.user_id = user_id
        self.tenant = tenant
        self.bearer_token = bearer_token
        self.user_confirmed = user_confirmed

class Tool:
    def __init__(self, name: str, description: str, input_schema: Dict[str, Any], mutating: bool, func):
        self.name = name
        self.description = description
        self.input_schema = input_schema
        self.mutating = mutating
        self.func = func
    def run(self, ctx: ToolContext, args: Dict[str, Any]) -> Any:
        return self.func(ctx, args)

def _auth_headers(ctx: ToolContext):
    return {"Authorization": f"Bearer {ctx.bearer_token}"} if ctx.bearer_token else {}

# --- Example tools ---

def _create_product(ctx: ToolContext, args: Dict[str, Any]):
    # args: seller_id, name, description, price_cents, stock
    url = f"{PUBLIC_API}/products"
    r = requests.post(url, json=args, headers=_auth_headers(ctx), timeout=30)
    r.raise_for_status()
    return r.json()

def _list_products(ctx: ToolContext, args: Dict[str, Any]):
    url = f"{PUBLIC_API}/products"
    r = requests.get(url, headers=_auth_headers(ctx), timeout=30)
    r.raise_for_status()
    return r.json()

def _propose_upgrade(ctx: ToolContext, args: Dict[str, Any]):
    """
    Create an 'upgrade proposal' ticket with structured content (no code changes applied).
    args: title, area ('frontend'|'backend'|'infra'), rationale, risks, test_plan
    """
    ticket = {
        "title": args.get("title","Upgrade Proposal"),
        "area": args.get("area","backend"),
        "rationale": args.get("rationale",""),
        "risks": args.get("risks",""),
        "test_plan": args.get("test_plan",""),
        "patch_suggestion": args.get("patch_suggestion","(provide diff later)"),
    }
    # For demo we just return it. You could POST to /tickets or write to DB.
    return {"status":"queued", "ticket": ticket}

def _health_check(ctx: ToolContext, args: Dict[str, Any]):
    # quick service probes
    import socket
    checks = {}
    for host, port in [("localhost",8000),("localhost",3000),("localhost",5432),("localhost",6379)]:
        s = socket.socket()
        s.settimeout(0.3)
        try:
            s.connect((host, port))
            checks[f"{host}:{port}"] = "open"
        except Exception:
            checks[f"{host}:{port}"] = "closed"
        finally:
            s.close()
    return checks

TOOL_REGISTRY: List[Tool] = [
    Tool(
        name="list_products",
        description="Read-only: list products in the marketplace.",
        input_schema={},
        mutating=False,
        func=_list_products
    ),
    Tool(
        name="create_product",
        description="Create a product for a seller. Args: seller_id, name, description, price_cents, stock",
        input_schema={"seller_id":"str","name":"str","description":"str","price_cents":"int","stock":"int"},
        mutating=True,
        func=_create_product
    ),
    Tool(
        name="propose_upgrade",
        description="Create an upgrade/repair proposal (does NOT change code). Args: title, area, rationale, risks, test_plan, patch_suggestion",
        input_schema={"title":"str","area":"str","rationale":"str","risks":"str","test_plan":"str","patch_suggestion":"str"},
        mutating=False,
        func=_propose_upgrade
    ),
    Tool(
        name="health_check",
        description="Check local service ports for quick diagnostics.",
        input_schema={},
        mutating=False,
        func=_health_check
    ),
]
