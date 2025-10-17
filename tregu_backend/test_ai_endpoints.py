import sys
import os
sys.path.insert(0, '.')

from app.main import app
import uvicorn
import threading
import time
import requests

def test_endpoint():
    time.sleep(3)  # Wait for server to start
    try:
        r = requests.get('http://localhost:8007/ai/characters')
        print('AI Characters Response:', r.text)
        print('Status Code:', r.status_code)
    except Exception as e:
        print('Request failed:', e)

if __name__ == "__main__":
    # Start test in background thread
    test_thread = threading.Thread(target=test_endpoint)
    test_thread.start()

    # Start server
    uvicorn.run(app, host='0.0.0.0', port=8007)