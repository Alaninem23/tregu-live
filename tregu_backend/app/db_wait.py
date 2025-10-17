import time
from sqlalchemy import text
from .db import engine

def wait_for_db(timeout_sec: int = 60):
    start = time.time()
    while True:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            if time.time() - start > timeout_sec:
                raise RuntimeError(f"Database not ready after {timeout_sec}s: {e}")
            time.sleep(1)
