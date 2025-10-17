"""
tregu_backend/app/middleware/webhook_quota.py

FastAPI middleware for daily webhook quota enforcement.
Returns 429 if tenant exceeds daily webhook limit for their tier.
"""

import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request
from typing import Optional
from ..core.webhooks_quota import allowed_webhook
from ..core.rate_limits import load_policy

def _is_webhook_path(path: str) -> bool:
    """Check if path matches webhook patterns from config."""
    # Common webhook patterns
    patterns = [
        r"^/api/integrations/.+/webhooks",
        r"^/webhooks/.+",
        r"^/api/webhooks/.+",
    ]
    
    for pattern in patterns:
        if re.match(pattern, path):
            return True
    return False

def _resolve_tier(request: Request) -> str:
    """Extract tier from request state or headers."""
    # Try request.state.tier (set by auth middleware)
    if hasattr(request.state, "tier"):
        return request.state.tier
    
    # Try X-Tier header
    tier = request.headers.get("X-Tier", "free")
    return tier.lower()

def _resolve_tenant(request: Request) -> Optional[str]:
    """Extract tenant_id from request state or headers."""
    if hasattr(request.state, "tenant_id"):
        return request.state.tenant_id
    
    return request.headers.get("X-Tenant-Id")

def _resolve_platform(path: str) -> str:
    """
    Extract platform from webhook path.
    
    Examples:
        /api/integrations/shopify/webhooks -> shopify
        /webhooks/woocommerce -> woocommerce
    """
    match = re.search(r"/(shopify|woocommerce|square|stripe|paypal|quickbooks|xero|salesforce|hubspot|slack|mailchimp)", path)
    if match:
        return match.group(1)
    return "unknown"

class WebhookDailyQuotaMiddleware(BaseHTTPMiddleware):
    """
    Enforce daily webhook quotas per tenant+platform+tier.
    
    Returns 429 with quota headers if limit exceeded.
    """
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Only check webhook paths
        if not _is_webhook_path(path):
            return await call_next(request)
        
        tier = _resolve_tier(request)
        tenant_id = _resolve_tenant(request)
        platform = _resolve_platform(path)
        
        if not tenant_id:
            # No tenant ID - skip quota check (unauthenticated webhook?)
            return await call_next(request)
        
        # Check quota
        allowed, used, limit = allowed_webhook(tenant_id, tier, platform)
        
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Daily webhook quota exceeded for {platform}",
                    "used": used,
                    "limit": limit,
                    "tier": tier,
                    "platform": platform,
                },
                headers={
                    "X-Webhook-Used": str(used),
                    "X-Webhook-Limit": str(limit),
                    "X-Webhook-Platform": platform,
                    "X-Webhook-Tier": tier,
                    "Retry-After": "86400",  # Retry after 1 day
                },
            )
        
        # Add quota headers to response
        response = await call_next(request)
        response.headers["X-Webhook-Used"] = str(used)
        response.headers["X-Webhook-Limit"] = str(limit)
        response.headers["X-Webhook-Platform"] = platform
        response.headers["X-Webhook-Tier"] = tier
        
        return response
