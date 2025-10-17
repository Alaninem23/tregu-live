#!/usr/bin/env python3
"""
Quick local smoke for the FastAPI app without starting a server.

Checks:
- GET /healthz
- GET /api/integration/debug/counts (if router is present)
- GET /api/profile/by-username/does-not-exist -> 404
"""
import os
import sys
from fastapi.testclient import TestClient


def main() -> int:
    # Keep limiter relaxed for local smoke
    os.environ.setdefault("ENABLE_RATE_LIMIT", "0")
    # Allow running from repo root by adding tregu_backend to sys.path
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    backend_root = os.path.join(repo_root, "tregu_backend")
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)
    from app.main import app

    client = TestClient(app)

    ok = True

    r = client.get("/healthz")
    print("/healthz:", r.status_code, r.json() if r.headers.get("content-type","" ).startswith("application/json") else r.text)
    ok &= r.status_code == 200 and r.json().get("ok") is True

    r = client.get("/api/integration/debug/counts")
    print("/api/integration/debug/counts:", r.status_code)
    ok &= r.status_code in (200, 404)

    r = client.get("/api/profile/by-username/does-not-exist")
    print("/api/profile/by-username/does-not-exist:", r.status_code)
    ok &= r.status_code == 404

    print("SMOKE:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
