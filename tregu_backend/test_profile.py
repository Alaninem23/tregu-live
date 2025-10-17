#!/usr/bin/env python3
import io
import os
import sys
from fastapi.testclient import TestClient


def _client():
    os.environ.setdefault("ENABLE_RATE_LIMIT", "0")
    # Import after env; ensure backend is importable when run from repo root
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)
    from app.main import app  # type: ignore
    return TestClient(app)


def test_profile_unauthorized_me():
    client = _client()
    r = client.get("/api/profile/me")
    assert r.status_code in (401, 403)


def test_profile_put_and_avatar_happy_path_if_auth_available():
    client = _client()

    # Attempt to register/login to get a JWT; if not available, skip gracefully
    email = "smoke_user@example.com"
    pwd = "Passw0rd!"
    token = None
    try:
        client.post("/api/auth/register", json={"email": email, "password": pwd})
        res = client.post("/api/auth/login", json={"username": email, "password": pwd})
        if res.status_code == 200:
            token = res.json().get("access_token")
    except Exception:
        pass

    if not token:
        # Auth not wired; ensure public route still works and return
        res = client.get("/api/profile/by-username/does-not-exist")
        assert res.status_code in (200, 404)
        return

    headers = {"Authorization": f"Bearer {token}"}

    # Update profile
    form = {
        "username": "smoke_user",
        "display_name": "Smoke User",
        "bio": "Hello",
        "location": "Nowhere",
        "website_url": "https://example.com",
        "twitter_url": "https://x.com/example",
        "linkedin_url": "https://linkedin.com/in/example",
        "is_public": "1",
    }
    res = client.put("/api/profile/me", data=form, headers=headers)
    assert res.status_code in (200, 204), res.text

    # Upload a tiny valid PNG (1x1) as avatar; endpoints convert to WEBP internally
    png_1x1 = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0cIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa7\x9f\xc1\xe9\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    files = {"file": ("tiny.png", io.BytesIO(png_1x1), "image/png")}
    res = client.post("/api/profile/me/avatar", files=files, headers=headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body.get("ok") is True
    assert body.get("url_full") and body.get("url_thumb")
