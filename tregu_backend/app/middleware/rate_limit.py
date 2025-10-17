# ORIGINAL for Tregu
import os, time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from redis.asyncio import from_url as redis_from_url

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple fixed-window limiter per IP (default 60 requests per 60s).
    For production, consider sliding-window or token-bucket, but this is clean and effective.
    """
    def __init__(self, app, requests: int = 60, per_seconds: int = 60, prefix: str = "rl"):
        super().__init__(app)
        self.requests = requests
        self.per = per_seconds
        self.prefix = prefix
        self.redis = redis_from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"
        window = int(time.time()) // self.per
        key = f"{self.prefix}:{ip}:{window}"

        # Increment counter
        current = await self.redis.incr(key)
        if current == 1:
            # first hit in window: set expiry
            await self.redis.expire(key, self.per)

        if current > self.requests:
            retry_after = await self.redis.ttl(key)
            return JSONResponse(
                {"error": "Rate limit exceeded", "retry_after_seconds": max(retry_after, 1)},
                status_code=429,
            )

        return await call_next(request)
