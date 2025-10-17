#!/usr/bin/env python3
import requests, threading, time, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from app.main import app
import uvicorn

BASE = "http://127.0.0.1:8010"

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8010, log_level="error")

def test_profile_unauthorized_me():
    t = threading.Thread(target=start_server, daemon=True)
    t.start(); time.sleep(1.5)
    r = requests.get(f"{BASE}/api/profile/me")
    assert r.status_code in (401, 403)

if __name__ == "__main__":
    test_profile_unauthorized_me()
    print("OK")