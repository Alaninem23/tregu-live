## Production with Docker Compose + Caddy

1) Copy `.env.prod.example` to `.env.prod` and fill real secrets and domain.
2) Edit `caddy/Caddyfile` and replace `YOUR_DOMAIN` with your real domain.
3) Bring the stack up:

```
docker compose --env-file .env.prod up -d --build
```

4) Run DB bootstrap/migrations:

```
docker compose exec backend python /app/scripts/migrate.py
```

5) Verify health:

```
curl -fsS https://YOUR_DOMAIN/api/integration/debug/health
curl -fsS https://YOUR_DOMAIN/api/integration/debug/version
```

# Tregu Deployment Infrastructure

Blue/Green deployment setup for FastAPI API + Next.js Web with health-gated flips and instant rollback.

## Architecture

- **Production domains**: tregu.com, www.tregu.com, api.tregu.com
- **Staging domains**: staging.tregu.com, staging-api.tregu.com
- **Container Registry**: ghcr.io/alaninem/tregu
- **Deployment strategy**: Blue/Green with zero-downtime cutover
- **Health checks**: Automated health gate before traffic flip
- **Rollback**: Instant flip back to previous version

## Quick Start

### Initial Setup (One-time)

1. Create folder structure on production host:
```bash
sudo mkdir -p /srv/tregu/{env,blue,green,shared/{nginx,scripts}}
sudo chown -R $USER:$USER /srv/tregu
```

2. Create external Docker network:
```bash
docker network create tregu_net
```

3. Copy files to server:
```bash
# From this deployment folder
scp -r env/* user@prod-host:/srv/tregu/env/
scp blue/docker-compose.yml user@prod-host:/srv/tregu/blue/
scp green/docker-compose.yml user@prod-host:/srv/tregu/green/
scp shared/nginx/tregu.conf user@prod-host:/srv/tregu/shared/nginx/
scp shared/scripts/*.sh user@prod-host:/srv/tregu/shared/scripts/
```

4. Make scripts executable:
```bash
ssh user@prod-host 'chmod +x /srv/tregu/shared/scripts/*.sh'
```

5. Enable Nginx config:
```bash
ssh user@prod-host 'sudo ln -s /srv/tregu/shared/nginx/tregu.conf /etc/nginx/sites-enabled/tregu.conf && sudo nginx -t && sudo systemctl reload nginx'
```

6. Start blue stack (initial):
```bash
ssh user@prod-host 'cd /srv/tregu/blue && docker compose up -d'
```

### Deploy New Version

1. Update image tags in `green/docker-compose.yml`
2. Deploy green stack:
```bash
ssh user@prod-host '/srv/tregu/shared/scripts/deploy_green.sh'
```

3. Flip traffic to green:
```bash
ssh user@prod-host '/srv/tregu/shared/scripts/flip_to.sh green'
```

4. If issues arise, rollback instantly:
```bash
ssh user@prod-host '/srv/tregu/shared/scripts/rollback.sh'
```

## Version Management

### Current Versions (Source of Truth)

**Production (Blue - Stable)**
- API: ghcr.io/alaninem/tregu/api:1.0.0
- Web: ghcr.io/alaninem/tregu/web:1.0.0

**Production (Green - Next)**
- API: ghcr.io/alaninem/tregu/api:1.0.1
- Web: ghcr.io/alaninem/tregu/web:1.0.1

### Domains

| Environment | App Domain | API Domain |
|-------------|------------|------------|
| Production | tregu.com, www.tregu.com | api.tregu.com |
| Staging | staging.tregu.com | staging-api.tregu.com |

## Environment Configuration

### Production
- Database: PostgreSQL at 10.0.0.20:5432 (tregu_prod)
- Redis: 10.0.0.21:6379/2
- JWT Issuer: https://api.tregu.com
- Feature Flags: allow_personal_to_comment=true, market_checkout_v2=false, enable_enterprise_modules=false

### Staging
- Database: PostgreSQL at 10.0.0.20:5432 (tregu_staging)
- Redis: 10.0.0.21:6379/3
- JWT Issuer: https://staging-api.tregu.com
- Feature Flags: allow_personal_to_comment=true, market_checkout_v2=false, enable_enterprise_modules=false

## Deployment Workflow

```
┌─────────────┐
│   Develop   │
└──────┬──────┘
       │ PR merge
       v
┌─────────────┐
│ Build Images│  ghcr.io/alaninem/tregu/{api,web}:X.Y.Z
└──────┬──────┘
       │
       v
┌─────────────┐
│   Staging   │  Test on staging.tregu.com
└──────┬──────┘
       │ Approved
       v
┌─────────────┐
│ Deploy Green│  deploy_green.sh
└──────┬──────┘
       │ Health OK
       v
┌─────────────┐
│  Flip Live  │  flip_to.sh green
└──────┬──────┘
       │
       ├─ Success → Keep green, blue becomes next staging
       └─ Issues  → rollback.sh (flip to blue instantly)
```

## Health Checks

Both API and Web containers have health checks:

**API**: `wget -qO- http://localhost:8000/healthz`
- Interval: 10s
- Timeout: 2s
- Retries: 6
- Start period: 20s

**Web**: `wget -qO- http://localhost:3000/api/healthz`
- Interval: 10s
- Timeout: 2s
- Retries: 6
- Start period: 20s

Deployment script waits for all containers to report healthy before allowing traffic flip.

## Scripts Reference

### deploy_green.sh
Pulls latest images, starts green stack, waits for health checks to pass.

### flip_to.sh [blue|green]
Updates Nginx upstream config and reloads Nginx to point to specified color.

### rollback.sh
Instantly flips traffic back to blue (stable) version.

## SEO Files

Place in Next.js `public/` folder:
- `robots.txt` - Search engine indexing rules
- `sitemap.xml` - Site structure for search engines

Includes all major routes:
- Public pages: /, /join, /market, /feed
- Business pages: /business/catalog, /business/products/new, /business/orders
- Account pages: /account, /account/orders, /account/settings
- Enterprise pages: /enterprise, /enterprise/modules/*
- Legal pages: /legal/tos, /legal/privacy

## Smoke Tests

Before flipping production, run on staging:

1. **Personal Account Flow**
   - Register at staging.tregu.com/join
   - Browse /market
   - Add item to cart
   - (Sandbox) checkout

2. **Business Account Flow**
   - Register at staging.tregu.com/join?mode=business
   - Add product at /business/products/new
   - Verify appears in /market and /feed
   - Check /business/orders

3. **Enterprise Account Flow**
   - Register at staging.tregu.com/join?mode=enterprise
   - Configure policies at /enterprise/settings/policies
   - Add product with ORG_ONLY visibility
   - Verify not visible to personal users

4. **Health Checks**
   - Verify staging-api.tregu.com/healthz returns 200
   - Verify staging.tregu.com/api/healthz returns 200

## Monitoring

After deployment, monitor:
- Nginx access/error logs: `/var/log/nginx/access.log`
- Container logs: `docker logs api_green`, `docker logs web_green`
- Health endpoints: `curl https://api.tregu.com/healthz`
- Application metrics: Sentry (if DSN configured)

## Security

- All secrets in environment files (not in images)
- Database passwords rotated per environment
- JWT secrets unique per environment
- Staging protected with basic auth or SSO (recommended)
- Production CSRF origins locked to tregu.com domains
