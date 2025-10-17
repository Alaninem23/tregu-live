#!/usr/bin/env bash
set -euo pipefail

echo "==> Tregu security scaffold starting…"

# 1) Directories
mkdir -p config semgrep .github/workflows scripts
mkdir -p app/core app/middleware
mkdir -p src/middleware src/security

# 2) config/security.yaml
cat > config/security.yaml <<'YAML'
version: 1
branding_lockdown: true
deny_routes:
  - path_pattern: "/branding"
    methods: ["POST","PUT","PATCH","DELETE"]
  - path_pattern: "/brand"
    methods: ["POST","PUT","PATCH","DELETE"]
  - path_pattern: "/theme"
    methods: ["POST","PUT","PATCH","DELETE"]
  - path_pattern: "/logo"
    methods: ["POST","PUT","PATCH","DELETE"]
  - path_pattern: "/favicon"
    methods: ["POST","PUT","PATCH","DELETE"]
csp:
  default_src: ["'self'"]
  img_src: ["'self'", "data:"]
  style_src: ["'self'", "'unsafe-inline'"]
  script_src: ["'self'"]
rate_limits:
  tiers:
    free:       { requests_per_minute: 60,  webhooks_per_day: 1000,   burst: 30 }
    verified:   { requests_per_minute: 300, webhooks_per_day: 10000,  burst: 100 }
    enterprise: { requests_per_minute: 2000, webhooks_per_day: 100000, burst: 400 }
  endpoints:
    - pattern: "^/api/integrations/.*"
      tier_override: null
    - pattern: "^/api/export/.*"
      tier_override:
        free: { requests_per_minute: 20, burst: 10 }
    - pattern: "^/api/market/catalog/publish$"
      tier_override:
        free: { requests_per_minute: 5, burst: 3 }
integrations:
  default_mode: "sandbox"
  proxy_only: true
  oauth_scopes:
    free: ["read_products","read_orders"]
    verified: ["read_products","read_orders","write_products","manage_inventory"]
    enterprise: ["read_products","read_orders","write_products","manage_inventory","write_orders"]
  require_domain_verification_for_write: true
  webhook:
    require_hmac: true
    signature_header: "X-Signature"
    allowed_timestamp_skew_seconds: 300
    replay_protection_ttl_seconds: 86400
    path_patterns:
      - "^/api/integrations/.+/webhooks"
      - "^/api/webhooks"
tokens:
  storage: "kms"
  encryption: "aes256-gcm"
  ttl_hours: { free: 24, verified: 168, enterprise: 168 }
  rotate_on_inactivity_days: 30
publishing:
  drafts_only_for_free: true
  moderation_required_for_free: true
audit:
  log_events:
    - integration.grant
    - integration.refresh
    - integration.webhook
    - integration.action
    - integration.reject
    - security.rate_limited
    - security.branding_403
  pii_redaction: true
feature_flags:
  dashboards: true
  uom_engine: true
  mrp_module: true
YAML

# 3) Python: config loader
cat > app/core/security_config.py <<'PY'
import yaml, pathlib
from pydantic import BaseModel
CONFIG_PATH = pathlib.Path(__file__).parents[2] / "config" / "security.yaml"

class SecurityConfig(BaseModel):
    branding_lockdown: bool
    deny_routes: list
    csp: dict
    rate_limits: dict
    integrations: dict
    tokens: dict
    publishing: dict
    audit: dict
    feature_flags: dict

def load_security_config() -> SecurityConfig:
    data = yaml.safe_load(CONFIG_PATH.read_text())
    return SecurityConfig(**data)

SECURITY = load_security_config()
PY

# 4) Python: rate-limiter (RPM + burst)
cat > app/core/rate_limits.py <<'PY'
from __future__ import annotations
import re, time, hashlib, os, pathlib, yaml
from typing import Tuple, Any
from redis import Redis
from fastapi import Request

CONFIG_PATH = pathlib.Path(__file__).parents[2] / "config" / "security.yaml"
POLICY = yaml.safe_load(CONFIG_PATH.read_text())

def endpoint_limits(path: str, method: str, tier: str) -> Tuple[int,int]:
    rpm = POLICY["rate_limits"]["tiers"][tier]["requests_per_minute"]
    burst = POLICY["rate_limits"]["tiers"][tier]["burst"]
    for ep in POLICY["rate_limits"].get("endpoints", []):
        if re.search(ep["pattern"], path):
            o = (ep.get("tier_override") or {}).get(tier)
            if o:
                rpm = o.get("requests_per_minute", rpm)
                burst = o.get("burst", burst)
            break
    return int(rpm), int(burst)

def key_for(req: Request, tier: str) -> str:
    tenant_id = (req.headers.get("X-Tenant-ID") or getattr(req.state, "tenant_id", None) or req.client.host)
    h = hashlib.sha1(req.url.path.encode()).hexdigest()[:8]
    return f"rl:{tier}:{tenant_id}:{h}"

def get_bucket():
    try:
        r = Redis.from_url(os.getenv("REDIS_URL","redis://localhost:6379/0"), decode_responses=False); r.ping()
        return RedisBucket(r)
    except Exception:
        return MemoryBucket()

class RedisBucket:
    def __init__(self, r: Redis): self.r = r
    def take(self, key: str, rpm: int, burst: int):
        now = int(time.time())
        data = self.r.hgetall(key)
        tokens = int(data.get(b"tokens", b"%d"%burst))
        reset  = int(data.get(b"reset",  b"%d"%(now+60)))
        if now >= reset:
            tokens = min(burst, tokens + rpm)
            reset = now + 60
        if tokens <= 0:
            return (False, 0, reset)
        tokens -= 1
        self.r.hset(key, mapping={"tokens": tokens, "reset": reset})
        self.r.expireat(key, reset + 5)
        return (True, tokens, reset)

class MemoryBucket:
    store={}
    def take(self, key: str, rpm: int, burst: int):
        import time
        now=int(time.time()); s=self.store.get(key, {"tokens":burst,"reset":now+60})
        if now>=s["reset"]: s={"tokens":min(burst,s["tokens"]+rpm),"reset":now+60}
        if s["tokens"]<=0: self.store[key]=s; return (False,0,s["reset"])
        s["tokens"]-=1; self.store[key]=s; return (True,s["tokens"],s["reset"])

BUCKET = get_bucket()
PY

cat > app/middleware/rate_limit.py <<'PY'
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request
from app.core.rate_limits import endpoint_limits, key_for, BUCKET

def _tier(req: Request) -> str:
    return (getattr(req.state,"tier",None) or req.headers.get("X-Tier") or "free").lower()

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        tier = _tier(request)
        rpm, burst = endpoint_limits(request.url.path, request.method, tier)
        allowed, remaining, reset_epoch = BUCKET.take(key_for(request, tier), rpm, burst)
        headers = {
            "X-RateLimit-Limit": str(rpm),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset_epoch),
            "X-RateLimit-Tier": tier
        }
        if not allowed:
            return JSONResponse({"detail":"Rate limit exceeded"}, status_code=429, headers=headers)
        resp = await call_next(request)
        for k,v in headers.items(): resp.headers[k]=v
        return resp
PY

# 5) Python: daily webhook quota
cat > app/core/webhooks_quota.py <<'PY'
import os, datetime as dt, pathlib, yaml
from typing import Tuple
from redis import Redis

CONFIG_PATH = pathlib.Path(__file__).parents[2] / "config" / "security.yaml"
POLICY = yaml.safe_load(CONFIG_PATH.read_text())
def _r() -> Redis: return Redis.from_url(os.getenv("REDIS_URL","redis://localhost:6379/0"))
def _key(tenant: str, platform: str) -> tuple[str,int]:
    today = dt.datetime.utcnow().date()
    k = f"whq:{tenant}:{platform}:{today.isoformat()}"
    ttl = int((dt.datetime.combine(today+dt.timedelta(days=1), dt.time.min) - dt.datetime.utcnow()).total_seconds())
    return k, max(ttl,60)
def allowed_webhook(tenant: str, tier: str, platform: str) -> Tuple[bool,int,int]:
    limit = int(POLICY["rate_limits"]["tiers"][tier]["webhooks_per_day"])
    r = _r(); key, ttl = _key(tenant, platform or "generic")
    pipe = r.pipeline(); pipe.incr(key,1); pipe.expire(key, ttl); used,_ = pipe.execute()
    return (used <= limit, int(used), int(limit))
PY

cat > app/middleware/webhook_quota.py <<'PY'
import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request
from app.core.webhooks_quota import allowed_webhook

PATS = [r"^/api/integrations/.+/webhooks", r"^/api/webhooks"]

class WebhookDailyQuotaMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not any(re.search(p, path) for p in PATS):
            return await call_next(request)
        tier = (getattr(request.state,"tier",None) or request.headers.get("X-Tier") or "free").lower()
        tenant = (request.headers.get("X-Tenant-ID") or getattr(request.state,"tenant_id",None) or request.client.host)
        platform = (path.split("/")[3] if path.startswith("/api/integrations/") and len(path.split("/"))>3 else "generic")
        ok, used, lim = allowed_webhook(tenant, tier, platform)
        hdrs = {"X-Webhook-Used": str(used), "X-Webhook-Limit": str(lim), "X-Webhook-Platform": platform, "X-Webhook-Tier": tier}
        if not ok: return JSONResponse({"detail":"Daily webhook quota exceeded"}, status_code=429, headers=hdrs)
        resp = await call_next(request); [resp.headers.__setitem__(k,v) for k,v in hdrs.items()]; return resp
PY

# 6) Node: policy loader & matchers
cat > src/security/policy.ts <<'TS'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import micromatch from 'micromatch'
export type Policy = {
  rate_limits:{ tiers:Record<string,{requests_per_minute:number; webhooks_per_day?:number; burst:number}>;
               endpoints?:Array<{pattern:string; tier_override?:Record<string,{requests_per_minute?:number; burst?:number}>}> }
}
const POLICY_PATH = path.join(process.cwd(),'config','security.yaml')
export function loadPolicy(): Policy { return yaml.load(fs.readFileSync(POLICY_PATH,'utf8')) as Policy }
export function resolveEndpointLimits(policy: Policy, p: string, tier: string){
  let { requests_per_minute:rpm, burst } = policy.rate_limits.tiers[tier] || policy.rate_limits.tiers['free']
  for (const ep of (policy.rate_limits.endpoints||[])){
    if (new RegExp(ep.pattern).test(p) || micromatch.isMatch(p, ep.pattern)){
      const o = ep.tier_override?.[tier]; if (o?.requests_per_minute) rpm=o.requests_per_minute; if (o?.burst) burst=o.burst; break;
    }
  }
  return { rpm, burst }
}
TS

# 7) Node: rate limit middleware
cat > src/middleware/rateLimit.ts <<'TS'
import type { Request, Response, NextFunction } from 'express'
import IORedis from 'ioredis'
import crypto from 'crypto'
import { loadPolicy, resolveEndpointLimits } from '../security/policy'
const policy = loadPolicy()
const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')
function tenantKey(req: Request, tier: string){
  const id = (req.header('X-Tenant-ID') || (req as any).tenant_id || req.ip)
  const h = crypto.createHash('sha1').update(req.path).digest('hex').slice(0,8)
  return `rl:${tier}:${id}:${h}`
}
async function take(key:string, rpm:number, burst:number){
  const now = Math.floor(Date.now()/1000)
  const data = await redis.hgetall(key)
  let tokens = data?.tokens ? parseInt(data.tokens) : burst
  let reset  = data?.reset ? parseInt(data.reset)  : now + 60
  if (now >= reset){ tokens = Math.min(burst, tokens + rpm); reset = now + 60 }
  if (tokens <= 0){ await redis.expire(key, Math.max(1, reset-now)+5); return { allowed:false, remaining:0, reset } }
  tokens -= 1; await redis.hset(key, { tokens: String(tokens), reset: String(reset) }); await redis.expireat(key, reset+5)
  return { allowed:true, remaining:tokens, reset }
}
export function rateLimit(){
  return async (req:Request, res:Response, next:NextFunction)=>{
    const tier = (req.header('X-Tier') || (req as any).tier || 'free').toLowerCase()
    const { rpm, burst } = resolveEndpointLimits(policy, req.path, tier)
    try{
      const { allowed, remaining, reset } = await take(tenantKey(req,tier), rpm, burst)
      res.setHeader('X-RateLimit-Limit', String(rpm))
      res.setHeader('X-RateLimit-Remaining', String(remaining))
      res.setHeader('X-RateLimit-Reset', String(reset))
      res.setHeader('X-RateLimit-Tier', tier)
      if (!allowed) return res.status(429).json({ detail: 'Rate limit exceeded' })
      return next()
    }catch(e){ res.setHeader('X-RateLimit-Bypass','redis_error'); return next() }
  }
}
TS

# 8) Node: webhook daily quota
cat > src/middleware/webhookQuota.ts <<'TS'
import IORedis from 'ioredis'
import fs from 'fs'; import yaml from 'js-yaml'; import path from 'path'
import type { Request, Response, NextFunction } from 'express'
const POLICY = yaml.load(fs.readFileSync(path.join(process.cwd(),'config','security.yaml'),'utf8')) as any
const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')
function utcDayKey(tenant:string, platform:string){ const day=new Date().toISOString().slice(0,10); return `whq:${tenant}:${platform}:${day}` }
function secondsToNextUtcMidnight(){ const n=new Date(); const x=new Date(Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()+1,0,0,0)); return Math.max(60, Math.floor((+x-+n)/1000)) }
function isWebhookPath(p:string){ return /^\/api\/integrations\/[^\/]+\/webhooks/.test(p) || /^\/api\/webhooks/.test(p) }
export function webhookQuota(){
  return async (req:Request,res:Response,next:NextFunction)=>{
    if (!isWebhookPath(req.path)) return next()
    const tier=(req.header('X-Tier')||(req as any).tier||'free').toLowerCase()
    const tenant=(req.header('X-Tenant-ID')||(req as any).tenant_id||req.ip)
    const platform=(req.path.split('/')[3] && req.path.startsWith('/api/integrations/'))? req.path.split('/')[3] : 'generic'
    const limit = POLICY?.rate_limits?.tiers?.[tier]?.webhooks_per_day; if (!limit) return next()
    try{
      const key=utcDayKey(tenant,platform); const used = await redis.incr(key); await redis.expire(key, secondsToNextUtcMidnight())
      res.setHeader('X-Webhook-Used', String(used)); res.setHeader('X-Webhook-Limit', String(limit))
      res.setHeader('X-Webhook-Platform', platform); res.setHeader('X-Webhook-Tier', tier)
      if (used > Number(limit)) return res.status(429).json({ detail: 'Daily webhook quota exceeded' })
      return next()
    }catch(e){ res.setHeader('X-Webhook-Quota','bypass_redis_error'); return next() }
  }
}
TS

# 9) Semgrep rules
cat > semgrep/security.yml <<'YML'
rules:
  - id: tregu-no-branding-endpoints
    message: "Branding customization endpoints are forbidden."
    severity: ERROR
    languages: [python, javascript, typescript]
    pattern-either:
      - pattern: |
          router.$METHOD("/**branding**", ...)
      - pattern: |
          router.$METHOD("/**theme**", ...)
      - pattern: |
          app.$METHOD("/**branding**", ...)
      - pattern: |
          app.$METHOD("/**theme**", ...)
  - id: tregu-no-branding-env-vars
    message: "Branding/theming env vars are forbidden."
    severity: ERROR
    languages: [javascript, typescript]
    patterns:
      - pattern-either:
          - pattern: process.env.$X
          - pattern: $CONF.$Y
      - metavariable-pattern: { metavariable: $X, pattern: /(BRAND|THEME|COLOR|FAVICON|LOGO)/i }
      - metavariable-pattern: { metavariable: $Y, pattern: /(brand|theme|color|favicon|logo)/i }
  - id: tregu-no-direct-platform-calls
    message: "All platform calls must go through the Integration Proxy."
    severity: ERROR
    languages: [javascript, typescript]
    patterns:
      - pattern-either:
          - pattern: fetch($URL, ...)
          - pattern: axios.$METHOD($URL, ...)
      - metavariable-pattern: { metavariable: $URL, pattern: /https?:\/\/(api\.)?(shopify|woocommerce|squareup|bigcommerce|magento|etsy)\./i }
    paths: { exclude: ["integration-proxy/**"] }
  - id: tregu-webhook-requires-hmac
    message: "Webhook handlers must verify HMAC signatures before processing."
    severity: WARNING
    languages: [python, javascript, typescript]
    patterns:
      - pattern-either:
          - pattern: |
              def $F(request, ...):
                  ...
                  $BODY = request.body()
                  ...
          - pattern: |
              app.$METHOD("/webhooks/$ANY", ($REQ, $RES) => {
                 ...
              })
  - id: tregu-no-eval
    message: "Use of eval / Function / exec is forbidden."
    severity: ERROR
    languages: [python, javascript, typescript]
    pattern-either: [ { pattern: eval(...) }, { pattern: new Function(...) }, { pattern: exec(...) } ]
  - id: tregu-no-hardcoded-secrets
    message: "Hardcoded secrets detected. Use KMS/Vault."
    severity: ERROR
    languages: [python, javascript, typescript, go, ruby]
    patterns:
      - pattern: /(?i)(secret|api[_-]?key|token|password)\s*[:=]\s*["'][A-Za-z0-9_\-\/\+=]{16,}["']/
  - id: tregu-no-open-redirect
    message: "Validate redirect_uri against allowlist."
    severity: ERROR
    languages: [python, javascript, typescript]
    patterns:
      - pattern-either:
          - pattern: |
              redirect_uri = $URI
              ...
          - pattern: |
              const redirect_uri = $URI
              ...
YML

# 10) GitHub Actions (CI)
cat > .github/workflows/security.yml <<'YML'
name: Security & Policy Checks
on:
  pull_request: { branches: [ main, develop ] }
  push: { branches: [ main ] }
jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - name: Install Semgrep
        run: pipx install semgrep
      - name: Run Semgrep rules
        run: semgrep --config semgrep/security.yml --error --timeout 300
  policy-smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate security.yaml
        run: |
          python - <<'PY'
          import yaml, sys
          d = yaml.safe_load(open('config/security.yaml'))
          assert d.get('branding_lockdown') is True
          for t in ('free','verified','enterprise'):
              assert t in d['rate_limits']['tiers']
          print('security.yaml looks valid.')
          PY
YML

echo "==> Files written."

# 11) Helpful summary
echo
echo "📦 Created files:"
printf "%s\n" \
  "config/security.yaml" \
  "app/core/security_config.py" \
  "app/core/rate_limits.py" \
  "app/middleware/rate_limit.py" \
  "app/core/webhooks_quota.py" \
  "app/middleware/webhook_quota.py" \
  "src/security/policy.ts" \
  "src/middleware/rateLimit.ts" \
  "src/middleware/webhookQuota.ts" \
  "semgrep/security.yml" \
  ".github/workflows/security.yml"

echo
echo "✅ Next steps:"
echo "1) Commit these files:  git add -A && git commit -m 'Scaffold security, rate limits, quotas, CI'"
echo "2) Wire FastAPI: in app/main.py -> add RateLimitMiddleware + WebhookDailyQuotaMiddleware"
echo "3) Wire Express: in src/server.ts -> app.use(rateLimit()); app.use(webhookQuota());"
echo "4) Set REDIS_URL in dev & live."
echo "5) Push and open a PR; CI should run 'Security & Policy Checks'."
