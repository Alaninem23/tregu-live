#!/usr/bin/env python3
import requests
import json
import time
import threading
import sys
import os
import pytest
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app
import uvicorn

# Skip these tests unless explicitly opted-in; they require a live server running on 127.0.0.1:8008
pytestmark = pytest.mark.skipif(os.getenv("LIVE_SERVER_TESTS") != "1", reason="Skip live-server tests unless LIVE_SERVER_TESTS=1")

base_url = "http://127.0.0.1:8008"

def test_login():
    """Test user login"""
    payload = {
        "email": "admin@tregu.com",
        "password": "Admin123!"
    }

    response = requests.post(f"{base_url}/api/auth/login", json=payload)
    print(f"Login response: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Login successful: {data}")
        return data.get("access_token")
    else:
        print(f"Login failed: {response.text}")
        return None

def test_register():
    """Test user registration"""
    payload = {
        "email": "test@example.com",
        "password": "TestPass123!",
        "role": "buyer"
    }

    response = requests.post(f"{base_url}/api/auth/register", json=payload)
    print(f"Register response: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"Registration successful: {data}")
        return data.get("access_token")
    else:
        print(f"Registration failed: {response.text}")
        return None

if __name__ == "__main__":
    print("Starting server for testing...")

    # Start server in background thread
    server_thread = threading.Thread(target=lambda: uvicorn.run(app, host="127.0.0.1", port=8008, log_level="info"))
    server_thread.daemon = True
    server_thread.start()

    # Wait for server to start
    time.sleep(3)

    print("Testing authentication endpoints...")

    # Test login
    token = test_login()

    # Test registration
    test_register()

    print("Tests completed.")