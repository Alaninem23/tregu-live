# Account Tiers, Platform Integrations & Branding Lockdown Implementation

## ✅ Completed Features

### 1. Account Tiers (`/types/account-tiers.ts`)
- **STARTER**: Platform Integrations, 5 integrations max, $49/month
- **PRO**: Platform Integrations + Business Analytics, unlimited, $149/month
- All tiers have `whiteLabel: false` (branding lockdown enforced)

### 2. Branding Lockdown (Multi-Layer Enforcement)

#### Files Created:
1. **`.branding-blocklist.txt`** - 30+ forbidden terms
2. **`/lib/brandPolicy.ts`** - Immutable policy constant, runtime checks
3. **`/tools/branding_scan.py`** - Python scanner (exit 1 on violations)
4. **`/semgrep/branding.yml`** - 6 structural rules
5. **`.github/workflows/branding-lockdown.yml`** - CI gate (blocks PRs)
6. **`.git-hooks/pre-commit`** - Local commit blocker
7. **`/tregu_backend/app/middleware/branding_lockdown.py`** - FastAPI 403 middleware

#### Enforcement Layers:
- **Build-time**: Semgrep, ESLint
- **Pre-commit**: Git hook blocks commits
- **CI/CD**: GitHub Actions blocks merge
- **Runtime**: Middleware returns 403, startup assertions
- **Legal**: TOS, CODEOWNERS

### 3. Platform Integrations Hub
- **`/types/integrations.ts`** - 12 integrations (Stripe, QuickBooks, Shopify, Salesforce, Slack, etc.)
- **`/app/integrations/page.tsx`** - Integration marketplace UI with tier checks
- Available for STARTER and PRO accounts

### 4. Business Analytics (Types Only)
- **`/types/analytics.ts`** - Widget types, data sources, 4 pre-built templates
- Dashboard UI implementation still needed

## 🚧 TODO: Complete Implementation

### High Priority:
1. **Business Analytics Dashboard UI** (`/app/analytics/page.tsx`)
   - Install `react-grid-layout`
   - Create widget components (LineChart, BarChart, KPICard, etc.)
   - Implement drag-and-drop builder
   - Add PRO tier check (redirect STARTER to upgrade)

2. **Update ESLint** - Add `no-restricted-syntax` rules for branding
3. **Integrate FastAPI Middleware** - Add to `main.py`
4. **Create CODEOWNERS** - Require platform-team approval

### Medium Priority:
5. Runtime tests (Jest/Playwright for Next.js, FastAPI startup assertion)
6. RBAC cleanup (remove branding.* roles)
7. Settings UI update (remove branding options)

### Low Priority:
8. Email/PDF template audit
9. TOS clause + CSP headers
10. Acceptance tests

## 🔐 Security Posture

**Zero-Tolerance Policy**: NO branding customization for ANY tier (including Enterprise)
- Multi-layer enforcement (build → pre-commit → CI → runtime)
- Audit logging tracks violation attempts
- Legal contracts enforce policy

## 📊 Feature Access

| Feature | FREE | STARTER | PRO | ENTERPRISE |
|---------|------|---------|-----|------------|
| Platform Integrations | ❌ | ✅ | ✅ | ✅ |
| Business Analytics | ❌ | ❌ | ✅ | ✅ |
| Branding Customization | ❌ | ❌ | ❌ | ❌ |

## 🚀 Quick Start

```bash
# Install pre-commit hook
chmod +x .git-hooks/pre-commit && cp .git-hooks/pre-commit .git/hooks/

# Test branding scan
python3 tools/branding_scan.py

# Test Semgrep
semgrep --config semgrep/branding.yml
```

**Status**: Phase 1 Complete (Account Tiers, Integrations Hub, Branding Lockdown infrastructure)
**Next**: Complete Business Analytics Dashboard UI with drag-and-drop widget builder
