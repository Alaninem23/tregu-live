from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.modules.ai.router import router as ai_router
except Exception:
    ai_router = None

from app.modules.auth.router import router as auth_router

app = FastAPI(docs_url="/docs", redoc_url="/redoc", openapi_url="/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def healthz():
    return {"ok": True}

if ai_router:
    app.include_router(ai_router, prefix="/ai")

app.include_router(auth_router, prefix="/api")
