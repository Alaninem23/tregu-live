# Tregu Deployment Runbook

Complete step-by-step guide for deploying Tregu to production with Blue/Green deployment strategy.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Initial Setup (One-Time)](#initial-setup-one-time)
3. [Deployment Workflow](#deployment-workflow)
4. [Rollback Procedure](#rollback-procedure)
5. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
6. [Staging Environment](#staging-environment)

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass locally and in CI/CD
- [ ] Database migrations are tested and reversible
- [ ] Environment variables are configured in `/srv/tregu/env/`
- [ ] Docker images are built and pushed to `ghcr.io/alaninem/tregu`
- [ ] Staging environment is tested and validated
- [ ] Smoke tests pass on staging
- [ ] Team is notified of deployment window
- [ ] Rollback plan is ready

---

## Initial Setup (One-Time)

### 1. Provision Infrastructure

**Requirements:**
- Ubuntu 22.04 LTS server
- Docker Engine 24+
- Docker Compose v2+
- Nginx 1.18+
- PostgreSQL 15+ (on separate host: 10.0.0.20)
- Redis 7+ (on separate host: 10.0.0.21)

**Install Docker:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

**Install Docker Compose:**
```bash
sudo apt update
sudo apt install docker-compose-plugin -y
```

**Install Nginx:**
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

### 2. Create Folder Structure

```bash
sudo mkdir -p /srv/tregu/{env,blue,green,staging,shared/{nginx,scripts}}
sudo chown -R $USER:$USER /srv/tregu
```

### 3. Copy Deployment Files

From your local `deployment/` folder:

```bash
# Set your server address
SERVER="user@prod-host"

# Copy environment files
scp env/*.env $SERVER:/srv/tregu/env/

# Copy Docker Compose files
scp blue/docker-compose.yml $SERVER:/srv/tregu/blue/
scp green/docker-compose.yml $SERVER:/srv/tregu/green/
scp staging/docker-compose.yml $SERVER:/srv/tregu/staging/

# Copy Nginx config
scp shared/nginx/tregu.conf $SERVER:/srv/tregu/shared/nginx/

# Copy scripts
scp shared/scripts/*.sh $SERVER:/srv/tregu/shared/scripts/
ssh $SERVER 'chmod +x /srv/tregu/shared/scripts/*.sh'
```

### 4. Create Docker Network

```bash
ssh $SERVER 'docker network create tregu_net'
```

### 5. Configure Nginx

```bash
ssh $SERVER << 'EOF'
  sudo ln -s /srv/tregu/shared/nginx/tregu.conf /etc/nginx/sites-available/tregu.conf
  sudo ln -s /etc/nginx/sites-available/tregu.conf /etc/nginx/sites-enabled/tregu.conf
  sudo nginx -t
  sudo systemctl reload nginx
EOF
```

### 6. Start Initial Blue Stack

```bash
ssh $SERVER << 'EOF'
  cd /srv/tregu/blue
  docker compose pull
  docker compose up -d
  
  # Wait for health
  sleep 30
  docker ps
  curl http://localhost:8001/healthz
  curl http://localhost:3001/api/healthz
EOF
```

### 7. Verify Public Access

```bash
# Test from local machine
curl https://api.tregu.com/healthz
curl https://tregu.com/healthz
```

---

## Deployment Workflow

### Phase 1: Prepare New Version

1. **Update Image Tags**

Edit `green/docker-compose.yml` with new version:

```yaml
services:
  api_green:
    image: ghcr.io/alaninem/tregu/api:1.0.2  # Update version
    
  web_green:
    image: ghcr.io/alaninem/tregu/web:1.0.2  # Update version
```

2. **Update Deployment Values**

Update `deployment-values.json` with new version info:

```json
{
  "VERSION_GREEN": {
    "API": "1.0.2",
    "WEB": "1.0.2",
    "STATUS": "NEXT - Ready for deployment",
    "DEPLOYED": null
  }
}
```

3. **Deploy to Staging First**

```bash
ssh $SERVER << 'EOF'
  cd /srv/tregu/staging
  
  # Update staging compose with new versions
  sed -i 's/:1.0.1/:1.0.2/g' docker-compose.yml
  
  docker compose pull
  docker compose up -d
  
  # Wait for health
  sleep 30
  docker logs api_staging
  docker logs web_staging
EOF
```

4. **Run Smoke Tests on Staging**

```bash
ssh $SERVER '/srv/tregu/shared/scripts/smoke_test.sh staging'
```

5. **Manual Testing on Staging**

- Register Personal account: https://staging.tregu.com/join
- Register Business account: https://staging.tregu.com/join?mode=BUSINESS
- Register Enterprise account: https://staging.tregu.com/join?mode=ENTERPRISE
- Test product creation and marketplace browsing
- Test checkout flow
- Verify enterprise policy settings
- Check all major features

### Phase 2: Deploy to Production Green

1. **Deploy Green Stack**

```bash
ssh $SERVER '/srv/tregu/shared/scripts/deploy_green.sh'
```

This script will:
- Pull latest images
- Start green containers
- Wait for health checks (up to 2 minutes)
- Report success or failure

2. **Verify Green Health**

```bash
ssh $SERVER << 'EOF'
  # Check container status
  docker ps | grep green
  
  # Check logs
  docker logs --tail 50 api_green
  docker logs --tail 50 web_green
  
  # Test health endpoints
  curl http://localhost:8002/healthz
  curl http://localhost:3002/api/healthz
EOF
```

3. **Test Green Directly (Optional)**

Port forward to test green before flipping:

```bash
ssh -L 8002:localhost:8002 -L 3002:localhost:3002 $SERVER

# In browser:
# http://localhost:3002 - Green web app
# http://localhost:8002/docs - Green API docs
```

### Phase 3: Flip Traffic to Green

1. **Create Deployment Announcement**

Notify team in Slack/Teams:
```
🚀 Deploying v1.0.2 to production
- Start time: [TIME]
- Expected duration: < 1 minute
- Rollback ready if needed
```

2. **Flip Traffic**

```bash
ssh $SERVER '/srv/tregu/shared/scripts/flip_to.sh green'
```

This takes effect **immediately** - traffic now goes to green.

3. **Verify Live Traffic**

```bash
# Test public endpoints
curl https://api.tregu.com/healthz
curl https://tregu.com/healthz

# Check Nginx is routing to green
ssh $SERVER 'grep -A2 "upstream api_live" /srv/tregu/shared/nginx/tregu.conf'
```

4. **Monitor for 5-10 Minutes**

```bash
# Watch logs for errors
ssh $SERVER 'docker logs -f api_green'

# In another terminal
ssh $SERVER 'tail -f /var/log/nginx/access.log'

# Check for error spikes
ssh $SERVER 'tail -f /var/log/nginx/error.log'
```

### Phase 4: Finalize or Rollback

**If everything looks good:**

1. Update deployment values:
```json
{
  "VERSION_GREEN": {
    "STATUS": "DEPLOYED - Now live in production",
    "DEPLOYED": "2025-10-15"
  }
}
```

2. Notify team:
```
✅ v1.0.2 deployed successfully
- Deployment completed at [TIME]
- All systems green
- Blue stack available for rollback if needed
```

3. Keep blue running for 24 hours, then:
```bash
# After 24 hours of green stability
ssh $SERVER << 'EOF'
  cd /srv/tregu/blue
  
  # Update blue to green's versions for next cycle
  sed -i 's/:1.0.0/:1.0.2/g' docker-compose.yml
  
  # Stop old blue
  docker compose down
  
  # Start new blue
  docker compose pull
  docker compose up -d
EOF
```

**If issues arise:**

See [Rollback Procedure](#rollback-procedure) below.

---

## Rollback Procedure

### Instant Rollback (< 10 seconds)

If green has issues, rollback instantly:

```bash
ssh $SERVER '/srv/tregu/shared/scripts/rollback.sh'
```

This immediately flips traffic back to blue (previous stable version).

### Verify Rollback

```bash
# Check traffic is on blue
ssh $SERVER 'grep -A2 "upstream api_live" /srv/tregu/shared/nginx/tregu.conf'

# Test endpoints
curl https://api.tregu.com/healthz
curl https://tregu.com/healthz

# Verify blue is receiving traffic
ssh $SERVER 'docker logs --tail 100 api_blue | grep -i "GET /healthz"'
```

### Post-Rollback

1. **Notify team:**
```
⚠️ Rolled back to v1.0.0
- Rollback completed at [TIME]
- Green v1.0.2 has issues
- Investigating...
```

2. **Investigate green issues:**
```bash
ssh $SERVER << 'EOF'
  # Check logs
  docker logs api_green > /tmp/api_green.log
  docker logs web_green > /tmp/web_green.log
  
  # Check container status
  docker ps -a | grep green
  docker inspect api_green
  docker inspect web_green
EOF
```

3. **Stop green (optional):**
```bash
ssh $SERVER 'cd /srv/tregu/green && docker compose down'
```

---

## Monitoring & Troubleshooting

### Health Check Commands

```bash
# Container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Health endpoints
curl http://localhost:8001/healthz  # Blue API
curl http://localhost:3001/api/healthz  # Blue Web
curl http://localhost:8002/healthz  # Green API
curl http://localhost:3002/api/healthz  # Green Web

# Public endpoints
curl https://api.tregu.com/healthz
curl https://tregu.com/healthz
```

### Log Commands

```bash
# Live tailing
docker logs -f api_blue
docker logs -f web_green

# Last N lines
docker logs --tail 100 api_green

# Time-filtered logs
docker logs --since 10m api_green

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Common Issues

#### Issue: Container unhealthy

```bash
# Check why health check is failing
docker inspect api_green | jq '.[0].State.Health'

# Check application logs
docker logs --tail 200 api_green | grep -i error

# Restart container
docker restart api_green
```

#### Issue: Database connection errors

```bash
# Test database connectivity from container
docker exec api_green sh -c 'apt-get update && apt-get install -y postgresql-client && psql $DATABASE_URL -c "SELECT 1"'

# Check env vars
docker exec api_green env | grep DATABASE
```

#### Issue: High response times

```bash
# Check container resources
docker stats api_green web_green

# Check database connections
docker exec api_green sh -c 'psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"'

# Check Redis
docker exec api_green sh -c 'redis-cli -u $REDIS_URL ping'
```

#### Issue: 502 Bad Gateway

```bash
# Check Nginx upstream config
cat /srv/tregu/shared/nginx/tregu.conf | grep -A5 upstream

# Test container port directly
curl http://localhost:8001/healthz
curl http://localhost:8002/healthz

# Check Nginx error log
tail -f /var/log/nginx/error.log
```

---

## Staging Environment

### Purpose

Staging mirrors production for testing before deployment.

### Access

- **App:** https://staging.tregu.com
- **API:** https://staging-api.tregu.com

### Deploy to Staging

```bash
ssh $SERVER << 'EOF'
  cd /srv/tregu/staging
  
  # Update image versions in docker-compose.yml
  vi docker-compose.yml  # or use sed
  
  docker compose pull
  docker compose up -d
  
  # Verify
  docker logs api_staging
  docker logs web_staging
  
  curl http://localhost:8003/healthz
  curl http://localhost:3003/api/healthz
EOF
```

### Run Smoke Tests

```bash
ssh $SERVER '/srv/tregu/shared/scripts/smoke_test.sh staging'
```

### Protect Staging (Recommended)

Add basic auth to Nginx for staging:

```bash
# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd_staging admin

# Update staging server block in tregu.conf
sudo vi /srv/tregu/shared/nginx/tregu.conf
```

Add to staging server blocks:
```nginx
auth_basic "Staging Environment";
auth_basic_user_file /etc/nginx/.htpasswd_staging;
```

---

## Deployment Checklist

Use this checklist for each deployment:

**Pre-Deployment**
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Docker images built and pushed
- [ ] Staging deployed and tested
- [ ] Smoke tests pass on staging
- [ ] Team notified
- [ ] Rollback plan ready

**Deployment**
- [ ] Update green docker-compose.yml with new versions
- [ ] Run `deploy_green.sh`
- [ ] Verify green health checks
- [ ] Create deployment announcement
- [ ] Run `flip_to.sh green`
- [ ] Verify public endpoints
- [ ] Monitor logs for 5-10 minutes

**Post-Deployment**
- [ ] Update deployment-values.json
- [ ] Notify team of success
- [ ] Monitor for 30 minutes
- [ ] Update blue after 24 hours
- [ ] Document any issues

**If Rollback Needed**
- [ ] Run `rollback.sh`
- [ ] Verify blue is serving traffic
- [ ] Notify team
- [ ] Investigate green issues
- [ ] Stop green containers
- [ ] Document root cause

---

## Emergency Contacts

- **DevOps Lead:** [Contact info]
- **Database Admin:** [Contact info]
- **On-Call Engineer:** [Contact info]

## Additional Resources

- GitHub Repository: https://github.com/alaninem/tregu
- CI/CD Pipeline: [Link]
- Monitoring Dashboard: [Link]
- Error Tracking (Sentry): [Link]
