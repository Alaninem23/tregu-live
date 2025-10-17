# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tregu is a multi-tenant marketplace platform (starter kit) that enables sellers to create and manage products, locations, and bookings. The project consists of a FastAPI backend, Next.js frontend, and PostgreSQL database, orchestrated via Docker Compose.

## Development Commands

### Backend (FastAPI + SQLAlchemy)
```bash
cd tregu_backend

# Start with Docker Compose (recommended)
docker compose up --build

# Run backend directly (requires PostgreSQL running)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Seed demo data
docker compose exec backend python app/seed.py

# Database migrations (Alembic)
alembic revision --autogenerate -m "description"
alembic upgrade head

# Initialize admin user
python init_admin_db.py

# Check database
python check_db.py
```

Backend runs on: http://localhost:8000
API docs (Swagger): http://localhost:8000/docs

### Frontend (Next.js 15 + React 19 + Tailwind)
```bash
cd tregu_frontend

# Install dependencies
npm install

# Run development server
npm run dev    # Runs on port 3000

# Build for production
npm build

# Start production server
npm start
```

Frontend runs on: http://localhost:3000

### Full Stack Development
```bash
# Start entire stack (backend, frontend, database, pgAdmin)
docker compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:3000 (may need to run separately outside Docker)
# pgAdmin: http://localhost:5050
```

### Testing Commands

Run a single test (example pattern - adapt to actual test structure):
```bash
cd tregu_backend
pytest tests/test_auth.py -v
```

## Architecture

### Backend Architecture (tregu_backend/)

**Entry Point**: `app/main.py` - FastAPI app with CORS middleware and router registration

**Core Layers**:
- **Database Models** (`app/db_models.py`): SQLAlchemy ORM models for multi-tenant architecture
  - Multi-tenant design with `tenant_id` foreign keys on all major entities
  - Core entities: Tenant, User, Seller, Product, Location, Pod, Booking, AdCampaign
  - Uses PostgreSQL with UUID primary keys

- **Routers** (`app/routers/`): API endpoints organized by feature domain
  - `auth.py` - Authentication endpoints (login, registration)
  - `ai.py` - AI-powered features (23KB file, extensive AI integration)
  - `admin.py` - Admin panel endpoints
  - `inventory.py` - Product inventory management (20KB file)
  - `locations.py` - Location and pod management
  - `two_factor.py` - 2FA implementation (TOTP, SMS, email)
  - Additional routers: account management, bookings, payments, file uploads

- **Middleware** (`app/middleware.py`, `app/middleware/`):
  - Request logging middleware (captures IP, geolocation for analytics)
  - Rate limiting (`middleware/rate_limit.py`)
  - Idempotency support with Redis (`middleware/idempotency_redis.py`)

- **Core Utilities** (`app/core/`):
  - `cache.py` - Caching layer
  - `router.py` - Router utilities
  - `telemetry.py` - OpenTelemetry tracing support
  - `ratelimit.py` - Rate limiting utilities
  - `middleware.py` - Core middleware patterns

- **Authentication** (`app/auth.py`, `app/security.py`):
  - Password hashing with bcrypt
  - JWT token generation
  - User authentication flow

- **Database** (`app/db.py`):
  - SQLAlchemy session management
  - Database connection configuration
  - Uses environment variable `DATABASE_URL` (PostgreSQL in production, SQLite for local)

**Key Backend Patterns**:
- Multi-tenant by design: All major entities scoped to `tenant_id`
- Router registration in `main.py` with try/except blocks for graceful degradation
- Request logging includes IP geolocation with privacy-compliant purging (see RUNBOOK.md section 6)
- Some routers intentionally disabled/skipped during testing (see commented sections in `main.py`)

### Frontend Architecture (tregu_frontend/)

**Framework**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS

**Entry Point**: `next.config.js` configures API proxy rewrites to backend at port 8003

**Directory Structure**:
- `app/` - Next.js App Router pages and layouts
  - `dashboard/` - Dashboard pages (buyer, seller, create, locations, profile, settings, etc.)
  - `components/` - Shared React components
  - `ai/`, `ai-test/`, `copilot/` - AI integration pages

- **Key Components** (`app/components/`):
  - `AuthCta.tsx` - Authentication call-to-action
  - `Header.tsx`, `UserMenu.tsx` - Navigation components
  - `useAuth.ts` - Authentication hook
  - `DashboardTopNav.tsx` - Dashboard navigation
  - `inventory-tabs.tsx` - Inventory management UI

- **API Integration**:
  - Next.js rewrites `/api/*` to FastAPI backend (configured in `next.config.js`)
  - Backend defaults to port 8003 in config (note: docker-compose exposes 8000)

**Frontend Patterns**:
- TypeScript build errors ignored (`ignoreBuildErrors: true` in next.config.js)
- Uses middleware.ts for auth/routing logic
- Components organized by feature domain under `app/dashboard/`

### Database Schema

Multi-tenant PostgreSQL database with UUID primary keys. Core tables:

- **tenants** - Top-level tenant isolation
- **users** - User accounts (scoped to tenant)
- **sellers** - Seller profiles with KYC status and Stripe integration
- **products** - Product catalog with inventory tracking
- **locations** - Physical locations for pods
- **pods** - Bookable units at locations with daily rates
- **bookings** - Pod reservations by sellers
- **ad_campaigns**, **ad_events** - Advertising system
- **two_factor_methods** - 2FA configuration per user

All major entities include `tenant_id` for multi-tenant isolation.

### Third-Party Integrations

- **Stripe**: Payment processing (Seller.stripe_account_id)
- **Redis**: Caching and idempotency middleware (via aioredis)
- **OpenTelemetry**: Distributed tracing (optional, configured in backend main.py)
- **IP Geolocation**: Third-party service for request logging (see privacy section)

## Data Privacy and Compliance

The application implements privacy-compliant request logging:

- **IP addresses**: Hashed before storage, purged after 30 days
- **Geolocation data**: City/postal level (not precise coordinates), purged after 12 months
- **Request logs**: Anonymized after 2 years

Run manual purge: `python tregu_backend/tools/purge_request_logs.py`

## Important Configuration Notes

- Backend uses `.env` file (copy from `.env.example`)
- Frontend API proxy points to port 8003, but docker-compose exposes backend on 8000
- PostgreSQL credentials in docker-compose: `app/app@db:5432/tregu`
- pgAdmin available at http://localhost:5050 (admin@tregu.com / admin123)
- JWT secret must be changed in production (`JWT_SECRET` env var)

## Seeding Data

The `seed.py` script creates:
- Demo tenant "tregu-demo"
- Admin user: `admin@tregu.com` / `Admin123!`
- Demo seller with sample product
- Sample location and pod

## Common Development Workflows

### Adding a New Feature

1. **Backend**: Create router in `app/routers/feature.py`
2. Add database models to `app/db_models.py` if needed
3. Register router in `app/main.py`
4. **Frontend**: Create page in `app/dashboard/feature/page.tsx`
5. Add API calls using Next.js rewrite proxy

### Database Changes

1. Modify models in `app/db_models.py`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review migration in `app/migrations/versions/`
4. Apply: `alembic upgrade head`

### Testing the Happy Path

1. Navigate to onboarding: http://localhost:3000/onboard
2. Create seller environment (note the Seller ID from API response)
3. Go to dashboard: http://localhost:3000/dashboard
4. Paste Seller ID, create a product
5. Verify product appears on homepage

Target: < 2 minutes to first product created

## Known Issues and Workarounds

- Some routers intentionally disabled in `main.py` (2FA, inventory) - uncomment when needed
- Frontend TypeScript errors ignored to allow rapid prototyping
- Next.js config points to port 8003 but docker-compose uses 8000 - adjust as needed
- SQLite fallback exists but PostgreSQL recommended for all features

## Architecture Principles

- **Multi-tenant first**: All domain models scoped to tenant_id
- **Graceful degradation**: Routers fail gracefully with try/except in main.py
- **Privacy by design**: Automatic PII purging for compliance
- **Modularity**: Feature routers, core utilities separated
- **Developer experience**: Hot reload, comprehensive API docs, simple seed data
