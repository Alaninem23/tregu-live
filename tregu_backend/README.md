# Tregu Backend (FastAPI) – Code-only

## Quickstart (Docker)
```bash
cp .env.example .env
docker compose up --build
# In another terminal:
docker compose exec api python app/main.py  # starts automatically via uvicorn
# Seed demo data:
docker compose exec api python seed.py
# API docs: http://localhost:8000/docs
```
