# ORIGINAL for Tregu
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

class RemoteError(Exception): ...

@retry(
    retry=retry_if_exception_type((httpx.HTTPError, RemoteError)),
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=6),
)
async def get_json(url: str, timeout_s: float = 5.0) -> dict:
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        r = await client.get(url)
        if r.status_code >= 500:
            raise RemoteError(f"upstream {r.status_code}")
        r.raise_for_status()
        return r.json()
