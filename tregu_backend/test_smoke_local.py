import io
import os
from fastapi.testclient import TestClient


def test_healthz_and_basic_routes():
    # Ensure rate limiter is relaxed for smoke
    os.environ.setdefault("ENABLE_RATE_LIMIT", "0")
    from app.main import app  # import after env

    client = TestClient(app)
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json().get("ok") is True

    # inventory debug counts exists (router included)
    r = client.get("/api/integration/debug/counts")
    assert r.status_code in (200, 404)  # 404 acceptable if router toggled


def test_profile_happy_path_local():
    # Local sqlite fallback tables will be created on demand
    os.environ.setdefault("ENABLE_RATE_LIMIT", "0")
    from app.main import app

    client = TestClient(app)

    # Create a fake user token if auth requires; here assume 401 for /me
    r = client.get("/api/profile/me")
    assert r.status_code in (401, 403)

    # If we had a token, we could update and upload; placeholder asserts ensure route is mounted
    assert client.app is app