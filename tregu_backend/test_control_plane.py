#!/usr/bin/env python3
import subprocess
import json
import time
import threading
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app
import uvicorn

# Test the control plane endpoints
base_url = "http://localhost:8008"

def run_curl(url, method="GET", data=None, headers=None):
    """Run curl command and return response"""
    cmd = ["curl", "-s", "-X", method, url]
    if data:
        cmd.extend(["-H", "Content-Type: application/json", "-d", json.dumps(data)])
    if headers:
        for header in headers:
            cmd.extend(["-H", header])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except:
                return result.stdout
        else:
            print(f"Curl error: {result.stderr}")
            return None
    except Exception as e:
        print(f"Error running curl: {e}")
        return None

def test_register_node():
    """Test node registration"""
    payload = {
        "tenant_id": "00000000-0000-0000-0000-000000000001",
        "node_config": {
            "node_id": "550e8400-e29b-41d4-a716-446655440000",
            "tenant_tier": "STARTER",
            "is_dedicated": False,
            "region": "us-east-1",
            "sync_capabilities": {
                "catalog_share": False,
                "vendor_directory": False,
                "availability_routing": False,
                "direct_peering": False
            }
        },
        "active_plugins": []
    }

    # No auth headers since we disabled auth for testing
    response = run_curl(f"{base_url}/ai/nodes/register", method="POST", data=payload)
    print(f"Register node response: {response}")
    if response and isinstance(response, dict) and "node_id" in response:
        return response.get("node_id")
    return None

def test_install_plugin(node_id):
    """Test plugin installation"""
    payload = {
        "node_id": node_id,
        "plugin": {
            "plugin_id": "550e8400-e29b-41d4-a716-446655440001",
            "name": "Basic Inventory Sync",
            "version": "1.0.0",
            "tier_compatibility": ["STARTER"],
            "is_marketplace": True,
            "requires_approval": True
        }
    }

    # No auth headers since we disabled auth for testing
    response = run_curl(f"{base_url}/ai/plugins/install", method="POST", data=payload)
    print(f"Install plugin response: {response}")

if __name__ == "__main__":
    print("Starting server for testing...")

    # Start server in background thread
    server_thread = threading.Thread(target=lambda: uvicorn.run(app, host="127.0.0.1", port=8008, log_level="info"))
    server_thread.daemon = True
    server_thread.start()

    # Wait for server to start
    time.sleep(3)

    print("Testing control plane endpoints...")
    node_id = test_register_node()
    if node_id:
        test_install_plugin(node_id)
    else:
        print("Node registration failed, skipping plugin install test")

    print("Tests completed.")