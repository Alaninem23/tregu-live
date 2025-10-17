# ORIGINAL for Tregu
import os, json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from redis.asyncio import from_url as redis_from_url

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
IDEM_TTL = int(os.getenv("IDEM_TTL", "3600"))

class IdempotencyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.redis = redis_from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

    async def dispatch(self, request: Request, call_next):
        # Only consider mutating methods
        if request.method not in ("POST", "PUT", "PATCH", "DELETE"):
            return await call_next(request)

        key = request.headers.get("Idempotency-Key")
        if not key:
            # No key provided -> DO NOT block; just proceed normally
            return await call_next(request)

        cache_key = f"idem:{key}"

        cached = await self.redis.get(cache_key)
        if cached:
            payload = json.loads(cached)
            return JSONResponse(payload["body"], status_code=payload["status"])

        response = await call_next(request)

        # Capture body for caching
        body_bytes = b"".join([chunk async for chunk in response.body_iterator])
        response.body_iterator = iter([body_bytes])

        try:
            body_json = json.loads(body_bytes.decode() or "{}")
        except Exception:
            body_json = {"ok": True}

        payload = {"status": response.status_code, "body": body_json}
        await self.redis.set(cache_key, json.dumps(payload), ex=IDEM_TTL)

        return response
