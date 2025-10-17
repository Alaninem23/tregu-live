from __future__ import annotations
import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from .context import new_request_context
from .telemetry import metrics

X_REQUEST_ID = "X-Request-ID"
X_TENANT = "X-Tenant"
X_USER = "X-User"

class ContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        # Extract minimal identity/tenant from headers (customize as needed)
        tenant = request.headers.get(X_TENANT)
        user_id = request.headers.get(X_USER)
        roles = request.headers.get("X-Roles", "")
        roles_list = [r.strip() for r in roles.split(",") if r.strip()]

        ctx = new_request_context(tenant=tenant, user_id=user_id, roles=roles_list, meta={"ip": request.client.host})
        request.state.ctx = ctx

        # Add a request-id header if provided or generate on response
        rid = request.headers.get(X_REQUEST_ID) or ctx.request_id

        start = time.perf_counter()
        try:
            response: Response = await call_next(request)
        except Exception as ex:
            duration = time.perf_counter() - start
            metrics.count("request.exceptions", 1, {"path": request.url.path})
            # Shape an error response uniformly
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=500,
                content={
                    "ok": False,
                    "error": {"code": "internal_error", "message": "Something went wrong."},
                    "meta": {"request_id": rid}
                }
            )

        duration = time.perf_counter() - start
        metrics.observe("request.duration_ms", duration * 1000.0, {"path": request.url.path, "status": str(response.status_code)})
        response.headers[X_REQUEST_ID] = rid
        return response
