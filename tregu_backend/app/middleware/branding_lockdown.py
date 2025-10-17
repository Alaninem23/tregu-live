"""
Branding Lockdown Middleware (FastAPI)
Blocks all POST/PUT/PATCH/DELETE requests to branding-related endpoints with 403
"""
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import re

# Forbidden path patterns (case-insensitive)
FORBIDDEN_PATTERNS = [
    r'/branding',
    r'/brand[/_-]',
    r'/theme',
    r'/theming',
    r'/logo',
    r'/favicon',
    r'/custom[-_]?css',
    r'/custom[-_]?style',
    r'/white[-_]?label',
    r'/rebrand',
    r'/tenant[/_-]brand',
    r'/tenant[/_-]theme',
    r'/tenant[/_-]logo',
    r'/color[-_]?scheme',
    r'/primary[-_]?color',
    r'/secondary[-_]?color',
]

# Compile regex patterns
FORBIDDEN_REGEX = [re.compile(pattern, re.IGNORECASE) for pattern in FORBIDDEN_PATTERNS]

# Forbidden HTTP methods for branding endpoints
FORBIDDEN_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}

def is_forbidden_path(path: str) -> bool:
    """Check if path matches any forbidden pattern"""
    return any(pattern.search(path) for pattern in FORBIDDEN_REGEX)

class BrandingLockdownMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces branding lockdown policy.
    Returns 403 for any POST/PUT/PATCH/DELETE to branding-related paths.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        method = request.method
        
        # Check if this is a forbidden operation
        if method in FORBIDDEN_METHODS and is_forbidden_path(path):
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "Branding customization is not permitted. Tregu brand identity is protected.",
                    "error": "BRANDING_FORBIDDEN",
                    "path": path,
                    "method": method,
                    "policy": "All branding customization is disabled by system policy. Contact support for questions."
                }
            )
        
        # Allow the request to proceed
        response = await call_next(request)
        return response

def assert_no_branding_routes(app):
    """
    Startup assertion: Check that no branding routes are registered.
    Raises RuntimeError if any POST/PUT/PATCH/DELETE branding routes exist.
    """
    from fastapi.routing import APIRoute
    
    violations = []
    
    for route in app.routes:
        if isinstance(route, APIRoute):
            path = route.path.lower()
            methods = route.methods or set()
            
            # Check if path contains branding keywords
            if is_forbidden_path(path):
                # Check if route allows modification methods
                forbidden_used = methods.intersection(FORBIDDEN_METHODS)
                if forbidden_used:
                    violations.append({
                        'path': route.path,
                        'methods': list(forbidden_used),
                        'name': route.name
                    })
    
    if violations:
        error_msg = "CRITICAL: Branding routes detected at startup!\n\n"
        for v in violations:
            error_msg += f"  - {v['path']} [{', '.join(v['methods'])}] (name: {v['name']})\n"
        error_msg += "\nBranding customization is FORBIDDEN. Remove these routes."
        raise RuntimeError(error_msg)
    
    print("✅ Branding lockdown: No forbidden routes detected")

# Audit log helper
def log_branding_attempt(
    tenant_id: str,
    user_id: str,
    path: str,
    method: str,
    ip_address: str = None
) -> None:
    """
    Log attempted branding customization for security audit.
    This helps track policy violation attempts.
    """
    # TODO: Integrate with your audit logging system
    import logging
    logger = logging.getLogger("branding_lockdown")
    
    logger.warning(
        f"Branding customization attempt blocked: "
        f"tenant={tenant_id} user={user_id} path={path} method={method} ip={ip_address}"
    )
