# Tregu Deployment Quick Reference

⚡ **Fast reference for common deployment commands**

## 🚀 Deploy New Version

```bash
# 1. Deploy to staging first
ssh prod-host '/srv/tregu/shared/scripts/deploy_green.sh'

# 2. Test green health
ssh prod-host 'curl http://localhost:8002/healthz'
ssh prod-host 'curl http://localhost:3002/api/healthz'

# 3. Flip production to green
ssh prod-host '/srv/tregu/shared/scripts/flip_to.sh green'

# 4. Verify live
curl https://api.tregu.com/healthz
curl https://tregu.com/healthz
```

## ⏪ Rollback

```bash
# Instant rollback to blue
ssh prod-host '/srv/tregu/shared/scripts/rollback.sh'

# Verify
curl https://api.tregu.com/healthz
```

## 🔍 Health Checks

```bash
# Container status
docker ps

# Health endpoints
curl http://localhost:8001/healthz  # Blue API
curl http://localhost:8002/healthz  # Green API
curl http://localhost:3001/api/healthz  # Blue Web
curl http://localhost:3002/api/healthz  # Green Web

# Public
curl https://api.tregu.com/healthz
curl https://tregu.com/healthz
```

## 📋 Logs

```bash
# Container logs
docker logs -f api_blue
docker logs -f api_green
docker logs --tail 100 web_green

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🧪 Smoke Tests

```bash
# Run against staging
/srv/tregu/shared/scripts/smoke_test.sh staging

# Run against prod
/srv/tregu/shared/scripts/smoke_test.sh prod
```

## 🔧 Troubleshooting

```bash
# Restart container
docker restart api_green

# Container health detail
docker inspect api_green | jq '.[0].State.Health'

# Check resources
docker stats api_green web_green

# Check which stack is live
grep -A2 "upstream api_live" /srv/tregu/shared/nginx/tregu.conf
```

## 📦 Version Info

**Current Deployment Values:** `deployment/deployment-values.json`

- Blue: v1.0.0 (stable)
- Green: v1.0.1 (next)
- Registry: ghcr.io/alaninem/tregu

## 🌐 Environments

| Environment | App URL | API URL |
|-------------|---------|---------|
| Production | tregu.com | api.tregu.com |
| Staging | staging.tregu.com | staging-api.tregu.com |

## 🔐 Access

**Environment files:** `/srv/tregu/env/`
- `prod.api.env` - Production API config
- `prod.web.env` - Production Web config
- `staging.api.env` - Staging API config
- `staging.web.env` - Staging Web config

## 📁 File Locations

```
/srv/tregu/
├── env/              # Environment variables
├── blue/             # Blue stack (stable)
├── green/            # Green stack (next)
├── staging/          # Staging stack
└── shared/
    ├── nginx/        # Nginx configs
    └── scripts/      # Deployment scripts
```

## 🎯 Deployment Checklist

- [ ] Tests pass on staging
- [ ] Smoke tests pass
- [ ] Team notified
- [ ] Deploy green: `deploy_green.sh`
- [ ] Verify health checks
- [ ] Flip traffic: `flip_to.sh green`
- [ ] Monitor for 10 minutes
- [ ] Update deployment-values.json

## 🆘 Emergency

**Rollback immediately if:**
- 5xx errors spike
- Health checks fail
- Performance degrades
- Database connection issues

**Command:** `/srv/tregu/shared/scripts/rollback.sh`

---

📖 **Full documentation:** `deployment/RUNBOOK.md`
