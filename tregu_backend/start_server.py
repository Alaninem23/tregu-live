import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app
import uvicorn
import threading
import time

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8003, log_level="info")

if __name__ == "__main__":
    print("Starting server in background thread...")
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    print("Server started on port 8003")
    # Keep the main thread alive
    while True:
        time.sleep(1)