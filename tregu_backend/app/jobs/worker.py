# ORIGINAL for Tregu
import asyncio, json, os
from typing import Callable, Dict, Awaitable
from redis.asyncio import from_url as redis_from_url

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QUEUE_KEY = os.getenv("QUEUE_KEY", "jobs")

redis = redis_from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
HANDLERS: Dict[str, Callable[[dict], Awaitable[None]]] = {}

def task(name: str):
    def deco(fn):
        HANDLERS[name] = fn
        return fn
    return deco

@task("send_email")
async def send_email(payload: dict):
    # Replace with real mailer
    await asyncio.sleep(0.1)
    print("EMAIL_SENT_TO", payload.get("to"))

async def loop():
    print("Worker started. Listening for jobs...")
    while True:
        raw = await redis.blpop(QUEUE_KEY, timeout=5)
        if not raw:
            continue
        _, msg = raw
        data = json.loads(msg)
        name, payload = data.get("name"), data.get("payload", {})
        fn = HANDLERS.get(name)
        if fn:
            try:
                await fn(payload)
            except Exception as e:
                print("JOB_FAILED", name, e)

if __name__ == "__main__":
    asyncio.run(loop())
