# Tregu – User Testing Runbook (Local)

## 0) Requirements

- Docker + Docker Compose (optional for full stack)
- Node.js 18+ (frontend only)
- Python 3.11+ (backend local)

## 1) Start API, DB, Redis
```bash
unzip Tregu_Starter_Kit_Lite.zip && cd Tregu_Starter_Kit_Lite
cp tregu_backend/.env.example tregu_backend/.env
docker compose up --build
```
- API: <http://localhost:8000/docs>
- (Optional) Seed demo data:
```bash
docker compose exec api python seed.py
```

## 2) Start Frontend
```bash
cd tregu_frontend
npm install
npm run dev
# open http://localhost:3000
```

## 3) Happy Path Test (5 minutes)
1. Go to **Start Selling** (http://localhost:3000/onboard).
2. Click **Create my environment**. Note the **Seller ID** returned in the API (from /sellers if needed via http://localhost:8000/docs).
3. Open **Dashboard** (http://localhost:3000/dashboard), paste your Seller ID, add a product, click **Create Product**.
4. Refresh **Home** – your product should appear.

## 4) What to Observe (Simplicity Goals)
- Time to first product created (target: < 2 minutes).
- Number of fields clicked/typed (target: minimal).
- Confusion points: onboarding, seller ID, product creation.

## 5) Next Iterations
- Add "Create my first product" to the onboarding flow.
- Replace Seller ID text box with a dropdown of sellers for the logged in user.
- Add inline guidance tooltips.

## 6) Data Privacy and Compliance

### Request Logging and IP Geolocation
The application captures IP addresses and geolocation data for security and analytics purposes:

- **IP Address Collection**: Server-side only, used for fraud prevention and capacity planning
- **Geolocation Data**: Derived from IP addresses using third-party services
- **Data Retention**:
  - Raw IP addresses: Purged after 30 days
  - Geolocation data (country, region, city, postal code): Purged after 12 months
  - Request logs: Kept for analytics with anonymized location data
  - Complete log deletion: After 2 years

### Privacy Compliance
- IP addresses are hashed before storage
- Location data is approximate (city/postal level, not precise coordinates)
- Admin access is restricted to authorized personnel only
- Data purging is automated and can be run manually

### Running Data Purging
To manually purge old data according to privacy policies:

```bash
cd tregu_backend
python tools/purge_request_logs.py
```

This script should be run periodically (e.g., daily) to maintain compliance.

---

## A) Backend-only Quick Start (no Docker)

Use this when you only need to validate backend ingestion locally with SQLite.

1) From repo root, run the smoke script:
  - powershell -NoProfile -ExecutionPolicy Bypass -File .\tregu_backend\tools\run_smoke.ps1
2) What it does:
  - Starts FastAPI via uvicorn on http://127.0.0.1:8003
  - Uploads inventory/customers/orders CSV templates
  - Runs map-validate → apply per domain
  - Prints batch IDs and final counts from /api/integration/debug/counts
3) Expected counts from templates:
  - inventory=2, customers=1, orders=1, order_lines=2
4) To run backend manually instead of the script:
  - cd .\tregu_backend; .\.venv312\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8003
  - Ensure ENABLE_RATE_LIMIT is not set (or 0) to avoid Redis requirement


