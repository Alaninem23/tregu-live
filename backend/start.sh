#!/usr/bin/env bash
set -euo pipefail
: "${PORT:=10000}"

if [ -d "alembic" ] || [ -f "alembic.ini" ]; then
  echo "[start.sh] Running Alembic migrations..."
  alembic upgrade head || echo "[start.sh] Alembic not configured; skipping."
fi

echo "[start.sh] Starting Gunicorn on port ${PORT}"
exec gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  -w 2 \
  -b 0.0.0.0:${PORT} \
  --timeout 120
