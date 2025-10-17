from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Dict, Any
import uuid
import time

@dataclass
class RequestContext:
    request_id: str
    tenant: Optional[str]
    user_id: Optional[str]
    roles: tuple[str, ...]
    start_time: float
    metadata: Dict[str, Any]

def new_request_context(
    tenant: Optional[str],
    user_id: Optional[str],
    roles: Optional[list[str]] = None,
    meta: Optional[Dict[str, Any]] = None
) -> RequestContext:
    return RequestContext(
        request_id=str(uuid.uuid4()),
        tenant=tenant,
        user_id=user_id,
        roles=tuple(roles or []),
        start_time=time.perf_counter(),
        metadata=meta or {}
    )
