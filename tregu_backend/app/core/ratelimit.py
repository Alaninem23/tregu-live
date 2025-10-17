from __future__ import annotations
import time
from typing import Dict, Tuple

class TokenBucket:
    def __init__(self, rate_per_sec: float, burst: int):
        self.rate = rate_per_sec
        self.burst = burst
        self.tokens = burst
        self.last = time.time()

    def allow(self) -> bool:
        now = time.time()
        elapsed = now - self.last
        self.last = now
        self.tokens = min(self.burst, self.tokens + elapsed * self.rate)
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False

# per (key=tenant:path)
_buckets: Dict[Tuple[str,str], TokenBucket] = {}

def allow(key: str, path: str, rate_per_sec=5.0, burst=20) -> bool:
    tb = _buckets.get((key, path))
    if not tb:
        tb = TokenBucket(rate_per_sec, burst)
        _buckets[(key, path)] = tb
    return tb.allow()
