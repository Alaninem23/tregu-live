"""
tregu_backend/app/core/rate_limits.py

Redis-backed token bucket rate limiter with policy-driven configuration.
Loads rate limits from config/security.yaml and enforces per-tier + per-endpoint limits.
"""

import os
import time
import hashlib
import redis
from typing import Tuple, Optional, Dict
from pathlib import Path
import yaml

# ═══════════════════════════════════════════════════════════════════════════════
# Policy Loading
# ═══════════════════════════════════════════════════════════════════════════════

_POLICY_CACHE: Optional[Dict] = None

def load_policy() -> Dict:
    """Load security.yaml once and cache it."""
    global _POLICY_CACHE
    if _POLICY_CACHE is not None:
        return _POLICY_CACHE
    
    # Try multiple paths (dev vs production)
    paths = [
        Path(__file__).parent.parent.parent.parent / "config" / "security.yaml",
        Path("/app/config/security.yaml"),
        Path("./config/security.yaml"),
    ]
    
    for p in paths:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                _POLICY_CACHE = yaml.safe_load(f)
                return _POLICY_CACHE
    
    raise FileNotFoundError("config/security.yaml not found in any expected location")


def endpoint_limits(path: str, method: str, tier: str) -> Tuple[int, int]:
    """
    Resolve rate limits for a given endpoint and tier.
    
    Returns: (requests_per_minute, burst)
    
    Logic:
      1. Load tier defaults from rate_limits.tiers[tier]
      2. Check for endpoint-specific overrides in rate_limits.endpoints
      3. If endpoint pattern matches and has tier_override, use that
      4. Otherwise, use tier default
    """
    policy = load_policy()
    
    tier = tier.lower()
    if tier not in ("free", "verified", "starter", "pro", "enterprise"):
        tier = "free"  # Default to most restrictive
    
    # Get tier defaults
    tier_config = policy["rate_limits"]["tiers"].get(tier, {})
    rpm = tier_config.get("requests_per_minute", 60)
    burst = tier_config.get("burst", 30)
    
    # Check endpoint overrides
    for endpoint_rule in policy["rate_limits"].get("endpoints", []):
        pattern = endpoint_rule.get("pattern", "")
        
        # Simple pattern matching (convert '^/api/export/.*' to startswith check)
        if pattern.startswith("^"):
            pattern = pattern[1:]  # Remove ^
        if pattern.endswith("$"):
            pattern = pattern[:-1]  # Remove $
        
        # Convert .* to empty string for prefix matching
        if pattern.endswith(".*"):
            pattern = pattern[:-2]
        
        # Check if path matches
        if path.startswith(pattern.replace(".*", "")):
            tier_override = endpoint_rule.get("tier_override")
            if tier_override and tier in tier_override:
                override_config = tier_override[tier]
                rpm = override_config.get("requests_per_minute", rpm)
                burst = override_config.get("burst", burst)
                break
    
    return rpm, burst


def key_for(tenant_id: Optional[str], ip: str, path: str, tier: str) -> str:
    """
    Generate Redis key for rate limiting.
    
    Format: ratelimit:{identifier}:{path_hash}:{tier}
    - identifier: tenant_id if authenticated, else IP address
    - path_hash: First 8 chars of SHA256(path) to avoid key explosion
    - tier: Account tier
    """
    identifier = tenant_id if tenant_id else ip
    path_hash = hashlib.sha256(path.encode()).hexdigest()[:8]
    return f"ratelimit:{identifier}:{path_hash}:{tier}"


# ═══════════════════════════════════════════════════════════════════════════════
# Token Bucket Implementation
# ═══════════════════════════════════════════════════════════════════════════════

class RedisBucket:
    """
    Token bucket rate limiter using Redis for distributed state.
    
    Algorithm:
      - Tokens refill at rate of RPM/60 per second
      - Burst capacity allows temporary spikes
      - Uses 1-minute sliding window
    """
    
    def __init__(self, redis_url: Optional[str] = None):
        """Initialize Redis connection."""
        if redis_url is None:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        
        self.redis_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    
    def take(self, key: str, rpm: int, burst: int) -> Tuple[bool, int, int]:
        """
        Attempt to consume 1 token from the bucket.
        
        Args:
            key: Redis key for this bucket
            rpm: Requests per minute allowed
            burst: Burst capacity (max tokens)
        
        Returns:
            (allowed, remaining, reset_epoch)
            - allowed: True if request is allowed
            - remaining: Tokens remaining (0 if denied)
            - reset_epoch: Unix timestamp when bucket resets
        """
        now = int(time.time())
        window_key = f"{key}:{now // 60}"  # 1-minute window
        
        try:
            pipe = self.redis_client.pipeline()
            pipe.incr(window_key)
            pipe.expire(window_key, 120)  # Keep for 2 minutes (window + buffer)
            results = pipe.execute()
            
            current_count = results[0]
            
            # Check if within burst capacity
            if current_count <= burst:
                allowed = True
                remaining = burst - current_count
            else:
                allowed = False
                remaining = 0
            
            reset_epoch = (now // 60 + 1) * 60  # Next minute boundary
            
            return allowed, remaining, reset_epoch
        
        except redis.RedisError as e:
            # Fail open on Redis errors (log and allow request)
            print(f"[WARN] Redis error in rate limiter: {e}")
            return True, burst, now + 60


class MemoryBucket:
    """
    In-memory fallback for when Redis is unavailable.
    
    Note: This is NOT distributed - each worker has its own state.
    Use only as fallback for Redis failures.
    """
    
    def __init__(self):
        self._buckets: Dict[str, Dict] = {}
    
    def take(self, key: str, rpm: int, burst: int) -> Tuple[bool, int, int]:
        """Same interface as RedisBucket.take()"""
        now = int(time.time())
        window_key = f"{key}:{now // 60}"
        
        if window_key not in self._buckets:
            self._buckets[window_key] = {"count": 0, "expires": now + 120}
        
        bucket = self._buckets[window_key]
        
        # Cleanup expired buckets
        self._buckets = {k: v for k, v in self._buckets.items() if v["expires"] > now}
        
        bucket["count"] += 1
        current_count = bucket["count"]
        
        if current_count <= burst:
            allowed = True
            remaining = burst - current_count
        else:
            allowed = False
            remaining = 0
        
        reset_epoch = (now // 60 + 1) * 60
        return allowed, remaining, reset_epoch


# ═══════════════════════════════════════════════════════════════════════════════
# Global Bucket Instance
# ═══════════════════════════════════════════════════════════════════════════════

_BUCKET: Optional[RedisBucket] = None

def get_bucket():
    """Get or create global bucket instance. Try Redis, fallback to Memory."""
    global _BUCKET
    if _BUCKET is not None:
        return _BUCKET
    
    try:
        _BUCKET = RedisBucket()
        # Test connection
        _BUCKET.redis_client.ping()
        return _BUCKET
    except Exception as e:
        print(f"[WARN] Redis unavailable, using in-memory rate limiter: {e}")
        return MemoryBucket()


BUCKET = get_bucket()
