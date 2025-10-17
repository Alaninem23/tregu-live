import sys
sys.path.insert(0, '.')
from minimal_app import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host='127.0.0.1', port=8003)