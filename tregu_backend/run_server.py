import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from minimal_backend import app
import uvicorn

if __name__ == "__main__":
    print("Starting minimal Tregu server on port 8010...")
    try:
        uvicorn.run(app, host="127.0.0.1", port=8010, log_level="info")
    except KeyboardInterrupt:
        print("Server stopped by user")
    except Exception as e:
        print(f"Server error: {e}")