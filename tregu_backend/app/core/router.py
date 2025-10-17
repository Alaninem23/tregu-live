from __future__ import annotations
import asyncio
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel, Field
from .models import Envelope, Page
from .feature_flags import flags
from .ratelimit import allow as rl_allow
from .cache import cache
from .events import publish
from .plugins import register, get as get_plugin, list_plugins

router = APIRouter(prefix="/core", tags=["core"])

# ---------- dependencies ----------
def get_ctx(request: Request):
    if not hasattr(request.state, "ctx"):
        raise HTTPException(500, "Context middleware not loaded")
    return request.state.ctx

# ---------- DTOs ----------
class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    tenant: Optional[str] = None
    page: int = 1
    per_page: int = 20

class SearchHit(BaseModel):
    id: str
    score: float
    kind: str
    title: str
    snippet: str

class SearchResponse(BaseModel):
    hits: list[SearchHit]

# ---------- Endpoints ----------
@router.get("/health", response_model=Envelope[dict])
async def health(ctx = Depends(get_ctx)):
    return Envelope(data={
        "status": "ok",
        "tenant": ctx.tenant,
        "time_ms": 0
    })

@router.get("/flags", response_model=Envelope[dict])
async def get_flags():
    return Envelope(data={"overrides": flags.overrides})

@router.post("/flags/set", response_model=Envelope[dict])
async def set_flag(name: str, value: bool):
    flags.set(name, value)
    return Envelope(data={"name": name, "value": value})

@router.get("/plugins", response_model=Envelope[dict])
async def plugins():
    return Envelope(data={"registered": list_plugins()})

# Demo search that caches per tenant & query
@router.post("/search", response_model=Envelope[Page[SearchHit]])
async def search(payload: SearchQuery, request: Request, ctx = Depends(get_ctx)):
    tenant = payload.tenant or ctx.tenant or "public"
    key = f"search:{tenant}:{payload.query}:{payload.page}:{payload.per_page}"

    # Rate limit per tenant+route
    if not rl_allow(tenant, "/core/search", rate_per_sec=3.0, burst=10):
        raise HTTPException(429, "Too many requests")

    cached = await cache.get(key)
    if cached:
        return Envelope(data=Page[SearchHit](**cached))

    # *** Replace this block with your real search ***
    # Fake ranked hits to illustrate API shape
    base = [
        SearchHit(id="prod:abc", score=0.91, kind="product", title="Eco Bottle", snippet="Durable, recycled plastic."),
        SearchHit(id="doc:wms", score=0.77, kind="doc", title="WMS Picking Guide", snippet="How to pick efficiently."),
        SearchHit(id="post:market", score=0.66, kind="post", title="New pods available", snippet="30-day rotating pods...")
    ]
    start = (payload.page - 1) * payload.per_page
    items = base[start:start+payload.per_page]
    page = Page[SearchHit](items=items, total=len(base), page=payload.page, per_page=payload.per_page)
    await cache.set(key, page.model_dump(), ttl=30)
    # Publish an event so other systems (AI, analytics) can react
    await publish("search.performed", {"tenant": tenant, "query": payload.query, "hits": len(items)})

    return Envelope(data=page)

# Call a registered plugin capability (decouples subsystems)
class PluginCall(BaseModel):
    name: str
    args: Dict[str, Any] = Field(default_factory=dict)

@router.post("/plugins/call", response_model=Envelope[dict])
async def plugins_call(payload: PluginCall, ctx = Depends(get_ctx)):
    fn = get_plugin(payload.name)
    if not fn:
        raise HTTPException(404, f"Plugin '{payload.name}' not found")

    # minimal isolation; could be moved to separate process runner if needed
    result = await asyncio.to_thread(fn, **payload.args)
    return Envelope(data=result)
