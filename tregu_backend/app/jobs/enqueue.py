# ORIGINAL for Tregu
import json
from redis.asyncio import from_url as redis_from_url
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QUEUE_KEY = os.getenv("QUEUE_KEY", "jobs")

redis = redis_from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

async def enqueue(name: str, payload: dict):
    msg = {"name": name, "payload": payload}
    await redis.rpush(QUEUE_KEY, json.dumps(msg))
