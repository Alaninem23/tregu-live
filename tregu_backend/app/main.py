import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.request_logging_middleware import RequestLoggingMiddleware
from app.geocode_service import main as create_geocode_app
from app.ai.control_plane import app as ai_app

# Security middleware
from app.middleware.branding_lockdown import BrandingLockdownMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.webhook_quota import WebhookDailyQuotaMiddleware

app = FastAPI(title="Tregu Backend", version="0.1.0")

# Mount AI control plane
# app.mount("/ai", ai_app)
try:
    from app.routers.ai import router as ai_router
    app.include_router(ai_router, prefix="/ai", tags=["ai"])
    print("[main] AI router loaded successfully")
except Exception as e:
    print("[main] AI router not loaded:", e)

# Mount geocode service
# try:
#     geocode_app = create_geocode_app()
#     app.mount("/geocode", geocode_app)
#     print("[main] Geocode service mounted at /geocode")
# except Exception as e:
#     print("[main] Geocode service not loaded:", e)

frontend_origins = [
    os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
    "http://127.0.0.1:3000",
    "http://localhost:5173", 
    "http://127.0.0.1:5173"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════════
# Security Middleware (Order matters: branding → rate limiting → webhook quotas)
# ═══════════════════════════════════════════════════════════════════════════════

# 1. Branding Lockdown - Block all branding customization endpoints (403)
app.add_middleware(BrandingLockdownMiddleware)

# 2. Rate Limiting - Enforce per-tier + per-endpoint rate limits (429)
# Disable by default for local smoke tests unless explicitly enabled
if os.getenv("ENABLE_RATE_LIMIT", "0") == "1":
    app.add_middleware(RateLimitMiddleware)
else:
    print("[main] RateLimitMiddleware disabled for local testing (set ENABLE_RATE_LIMIT=1 to enable)")

# 3. Webhook Quotas - Enforce daily webhook limits per tenant+platform (429)
app.add_middleware(WebhookDailyQuotaMiddleware)

# Add request logging middleware
# app.add_middleware(RequestLoggingMiddleware)  # Temporarily disabled for testing

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/")
def root():
    return {"name": "Tregu Backend", "status": "ok"}

try:
    from app.routers.auth import router as auth_router
    app.include_router(auth_router, prefix="/api")
    print("[main] Auth router mounted at /api")
except Exception as e:
    print("[main] Auth router not loaded:", e)

try:
    # from app.routers.two_factor import router as two_factor_router
    # app.include_router(two_factor_router)
    # print("[main] 2FA router mounted")
    print("[main] 2FA router skipped for testing")
except Exception as e:
    print("[main] 2FA router not loaded:", e)

try:
    # from app.routers.locations import router as locations_router
    # app.include_router(locations_router, prefix="/api")
    # print("[main] Locations router mounted at /api")
    print("[main] Locations router temporarily disabled for testing")
except Exception as e:
    print("[main] Locations router not loaded:", e)

try:
    # from app.routers.admin import router as admin_router
    # app.include_router(admin_router, prefix="/api")
    # print("[main] Admin router mounted at /api")
    print("[main] Admin router temporarily disabled for testing")
except Exception as e:
    print("[main] Admin router not loaded:", e)

try:
    from app.routers.inventory import router as inventory_router
    app.include_router(inventory_router, prefix="/api")
    print("[main] Inventory router mounted at /api")
except Exception as e:
    print("[main] Inventory router not loaded:", e)

# Mount integration router
try:
    from app.routes.integration import router as integration_router
    app.include_router(integration_router, prefix="/api")
    print("[main] Integration router mounted at /api")
except Exception as e:
    print("[main] Integration router not loaded:", e)

# Mount profile router
try:
    from app.routes.profile import router as profile_router
    # router already has prefix /api/profile
    app.include_router(profile_router)
    print("[main] Profile router mounted at /api/profile")
except Exception as e:
    print("[main] Profile router not loaded:", e)

# Serve local media in development if directory exists
try:
    media_root = os.getenv("MEDIA_ROOT", os.path.join(os.path.dirname(__file__), "..", "var", "media"))
    media_root = os.path.abspath(media_root)
    if not os.path.isdir(media_root):
        os.makedirs(media_root, exist_ok=True)
    app.mount("/media", StaticFiles(directory=media_root), name="media")
    print(f"[main] Serving local media from {media_root} at /media")
except Exception as e:
    print("[main] Media mount failed:", e)

# Removed the if __name__ == "__main__" block to prevent auto-startup when importing