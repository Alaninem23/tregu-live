from fastapi.testclient import TestClient


def test_public_profile_not_found():
    # Import after env to respect any test-time overrides
    from app.main import app

    client = TestClient(app)
    r = client.get("/api/profile/by-username/does-not-exist")
    assert r.status_code == 404