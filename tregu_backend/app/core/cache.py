from __future__ import annotations
import os, json, asyncio, time
from typing import Any, Optional

class InMemoryCache:
    def __init__(self):
        self._store: dict[str, tuple[float|None, Any]] = {}

    async def get(self, key: str) -> Optional[Any]:
        item = self._store.get(key)
        if not item:
            return None
        exp, val = item
        if exp and exp < time.time():
            self._store.pop(key, None)
            return None
        return val

    async def set(self, key: str, val: Any, ttl: Optional[int] = None):
        exp = time.time() + ttl if ttl else None
        self._store[key] = (exp, val)

    async def delete(self, key: str):
        self._store.pop(key, None)

try:
    import redis.asyncio as redis  # optional
except Exception:
    redis = None

class Cache:
    """Auto-chooses Redis if REDIS_URL is set; otherwise in-memory."""
    def __init__(self):
        url = os.getenv("REDIS_URL")
        if url and redis:
            self.kind = "redis"
            self.client = redis.from_url(url, encoding="utf-8", decode_responses=True)
        else:
            self.kind = "memory"
            self.client = InMemoryCache()

    async def get(self, key: str):
        if self.kind == "redis":
            v = await self.client.get(key)
            return json.loads(v) if v else None
        return await self.client.get(key)

    async def set(self, key: str, val: Any, ttl: Optional[int] = None):
        if self.kind == "redis":
            payload = json.dumps(val)
            if ttl:
                await self.client.setex(key, ttl, payload)
            else:
                await self.client.set(key, payload)
        else:
            await self.client.set(key, val, ttl)

    async def delete(self, key: str):
        if self.kind == "redis":
            await self.client.delete(key)
        else:
            await self.client.delete(key)

cache = Cache()
