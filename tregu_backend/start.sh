#!/usr/bin/env bash
set -euo pipefail
export PORT="${PORT:-10000}"
exec gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:$PORT --timeout 120
