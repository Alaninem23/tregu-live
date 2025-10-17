"""
tregu_backend/app/core/webhooks_quota.py

Daily webhook quota enforcement per tenant+platform using Redis.
Loads limits from config/security.yaml (webhooks_per_day by tier).
"""

import os
import redis
import hashlib
from datetime import datetime, timezone
from typing import Tuple
from .rate_limits import load_policy

def _redis():
    """Get Redis client."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    return redis.from_url(redis_url, decode_responses=True, socket_timeout=2)

def _utc_day_key(tenant_id: str, platform: str) -> Tuple[str, int]:
    """
    Generate Redis key for current UTC day and calculate TTL.
    
    Returns: (key, ttl_seconds)
    Example: ("webhook_quota:tenant_abc:shopify:20251016", 86400)
    """
    utc_now = datetime.now(timezone.utc)
    day_str = utc_now.strftime("%Y%m%d")
    key = f"webhook_quota:{tenant_id}:{platform}:{day_str}"
    
    # Calculate seconds until next UTC midnight
    next_midnight = utc_now.replace(hour=0, minute=0, second=0, microsecond=0)
    next_midnight = next_midnight.replace(day=next_midnight.day + 1)
    ttl = int((next_midnight - utc_now).total_seconds())
    
    return key, ttl

def allowed_webhook(tenant_id: str, tier: str, platform: str) -> Tuple[bool, int, int]:
    """
    Check if webhook is allowed within daily quota.
    
    Args:
        tenant_id: Tenant identifier
        tier: Account tier (free, verified, starter, pro, enterprise)
        platform: Integration platform (shopify, woocommerce, etc)
    
    Returns:
        (allowed, used, limit)
        - allowed: True if within quota
        - used: Current usage count for today
        - limit: Daily limit for this tier
    """
    tier = tier.lower()
    policy = load_policy()
    
    # Get daily limit for tier
    tier_config = policy["rate_limits"]["tiers"].get(tier, {})
    limit = tier_config.get("webhooks_per_day", 1000)
    
    try:
        r = _redis()
        key, ttl = _utc_day_key(tenant_id, platform)
        
        # Increment counter
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, ttl)
        results = pipe.execute()
        
        used = results[0]
        allowed = used <= limit
        
        return allowed, used, limit
    
    except redis.RedisError as e:
        print(f"[WARN] Redis error in webhook quota: {e}")
        # Fail open on Redis errors
        return True, 0, limit
