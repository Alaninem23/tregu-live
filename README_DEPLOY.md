# Tregu — Live Deploy Pack (Render + Neon + Upstash + DO Spaces)

## Files
- `render.yaml` — Render blueprint for API, frontend, and worker.
- `.env.example` — Env var template for backend + frontend.
- `backend/start.sh` — Alembic migrate + Gunicorn start script.
- `backend/app/worker.py` — Minimal background worker placeholder.
- `.github/workflows/db-backup.yml` — Nightly Neon dump to DO Spaces.

## Quick Start
1. Create Neon (Postgres), Upstash (Redis), and DO Spaces (S3) resources.
2. Connect GitHub repo to Render; create from `render.yaml`.
3. Set env vars in Render services (copy keys from provider dashboards).
4. Deploy, check `/health`, test a file upload round-trip.

## Backups
Neon gives PITR; the GitHub Action adds daily dumps to Spaces (`s3://<bucket>/db_backups/`).
