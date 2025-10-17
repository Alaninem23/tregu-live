#!/usr/bin/env python3
"""Test script to debug API endpoints"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_conversations():
    """Test AI conversations endpoint without auth"""
    print("\n=== Testing /ai/conversations (no auth) ===")
    try:
        r = requests.get(f"{BASE_URL}/ai/conversations")
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

def test_register():
    """Test registration endpoint"""
    print("\n=== Testing /api/auth/register ===")
    payload = {"email": "testuser@example.com", "password": "SecurePass123"}
    try:
        r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_conversations()
    test_register()
