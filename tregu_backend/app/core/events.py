from __future__ import annotations
import os, json, asyncio
from typing import Callable, Dict, Any, DefaultDict
from collections import defaultdict

# In-process subscribers
_subs: DefaultDict[str, list[Callable[[Dict[str, Any]], None]]] = defaultdict(list)

# Optional Redis pub/sub
try:
    import redis.asyncio as redis
except Exception:
    redis = None

_redis = None

async def init_bus():
    global _redis
    url = os.getenv("REDIS_URL")
    if url and redis:
        _redis = redis.from_url(url, encoding="utf-8", decode_responses=True)

async def subscribe(topic: str, handler: Callable[[Dict[str, Any]], None]):
    _subs[topic].append(handler)

async def publish(topic: str, message: Dict[str, Any]):
    # local
    for h in list(_subs.get(topic, [])):
        try:
            h(message)  # fire-and-forget style (non-async handlers)
        except Exception:
            pass
    # distributed
    if _redis:
        ch = f"tregu.events.{topic}"
        await _redis.publish(ch, json.dumps(message))

# Background Redis listener (optional)
async def run_redis_listener():
    if not _redis:
        return
    pubsub = _redis.pubsub()
    await pubsub.psubscribe("tregu.events.*")
    async for msg in pubsub.listen():
        if msg["type"] == "pmessage":
            payload = json.loads(msg["data"])
            topic = msg["channel"].split("tregu.events.", 1)[-1]
            for h in list(_subs.get(topic, [])):
                try:
                    h(payload)
                except Exception:
                    pass
