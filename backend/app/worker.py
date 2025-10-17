"""
Minimal background worker for Tregu.
"""
import time
def main():
    print("[worker] Starting background worker (placeholder).")
    print("[worker] Connect to Redis via REDIS_URL and poll for jobs here.")
    while True:
        time.sleep(5)
if __name__ == "__main__":
    main()
