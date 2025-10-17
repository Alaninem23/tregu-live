# Tregu Enterprise: Nav Customization + Market Publishing — Implementation Packet

## Status: Ready for Implementation
**Date:** October 16, 2025  
**Priority:** HIGH - Core Enterprise Feature

---

## A) Remove Global Nav on Enterprise + Add Enterprise Layout

### Create `app/enterprise/layout.tsx`
**Purpose:** Enterprise-specific layout that replaces global navigation with tenant-customizable navbar

**Key Features:**
- Server component that fetches tenant nav config
- Role-based filtering of nav items
- Sticky header with logo, tenant navbar, and admin controls
- Dev/Live environment badge
- No global navigation rendered

**Implementation Status:** ⏳ Pending

---

## B) Tenant-Customizable Navbar

### 1. Type Definitions (`types/nav.ts`)
```typescript
export type NavItem = {
  id: string                  // Stable key
  label: string               // Visible text (NO EMOJI)
  href: string                // Route or external URL
  iconId?: string             // Key from /icons/tregu
  external?: boolean          // Opens in new tab
  roles?: string[]            // RBAC gating
  visible: boolean            // Tenant toggle
}

export type NavConfig = {
  items: NavItem[]
  updatedAt: string           // ISO timestamp
  updatedBy: string           // User id/email
}
```

**Implementation Status:** ⏳ Pending

### 2. Default Configuration (`lib/enterprise-default-nav.ts`)
**9 Default Nav Items:**
- Home (all users)
- Finance (finance.read)
- WMS (all users)
- Manufacturing/MRP (all users)
- Shipping/TMS (all users)
- Planning (all users)
- Analytics (all users)
- Market Publishing (commerce.read, hidden by default)
- Admin (admin.manage)

**Implementation Status:** ⏳ Pending

### 3. Admin Customization UI (`app/enterprise/admin/navigation/page.tsx`)
**Features:**
- List view of all nav items with inline editing
- Checkbox toggle for visibility
- Text inputs for label and href
- Icon selection (from Tregu icon set)
- Role assignment (comma-separated)
- Up/Down buttons for reordering
- Remove button per item
- Add new link button
- Emoji validation (blocks save)
- Href validation (relative or absolute http(s))
- Save to backend API

**Implementation Status:** ⏳ Pending

### 4. API Routes (`app/api/enterprise/nav/route.ts`)
**GET `/api/enterprise/nav`:**
- Fetches from backend
- Falls back to DEFAULT_ENTERPRISE_NAV on error
- Returns NavConfig JSON

**PUT `/api/enterprise/nav`:**
- Accepts NavConfig JSON
- Forwards to backend with validation
- Returns 204 on success

**Implementation Status:** ⏳ Pending

---

## C) Market Publishing Module

### Completed ✅
1. ✅ Feature flags (market_publish, catalog_upload)
2. ✅ Primary "Publish to Market" button in Enterprise header
3. ✅ Landing page (`/enterprise/market`)
4. ✅ Upload workflow (`/enterprise/market/upload`)
5. ✅ History page with SWR (`/enterprise/market/history`)
6. ✅ API proxies (publish, history)
7. ✅ CSV parsing, field mapping, validation

### Remaining Work
- Backend endpoints (POST /enterprise/market/publish, GET /enterprise/market/history)
- Testing with actual CSV uploads
- Error handling and retry logic

---

## D) Icon System (No Emoji Policy)

### Completed ✅
1. ✅ Icon design tokens (`/lib/icon-tokens.ts`)
2. ✅ 13 custom SVG icons created:
   - Finance, WMS, MRP, TMS, Planning, CRM, Analytics
   - Integrations, Admin, P2P, O2C, Inventory, Market
3. ✅ Icon registry (`/icons/tregu/index.ts`)
4. ✅ SystemCard integration
5. ✅ Print CSS (black icons, no shadows)

### Remaining Work
- ⏳ Create HomeIcon component
- ⏳ Update registry to include 'home' key
- ⏳ Verify all 13 icons render in navbar at 18px

---

## E) Backend Endpoints (FastAPI Contract)

### Required Endpoints

**1. `GET /enterprise/nav`**
- Returns: `NavConfig` (tenant-specific or default)
- Auth: Any authenticated enterprise user
- Caching: None (fetch fresh config)

**2. `PUT /enterprise/nav`**
- Accepts: `NavConfig` JSON body
- Auth: Requires `admin.manage` role
- Validation:
  - No emoji in labels (Unicode range U+1F300-1FAFF, U+2600-26FF)
  - Href must be absolute http(s) or site-relative `/...`
  - iconId must exist in Tregu icon registry
  - Role names must be in RBAC catalog
- Persists: To `enterprise_nav` table (keyed by tenant_id)
- Returns: 204 on success, 400 on validation error, 403 on auth failure

**3. `POST /enterprise/market/publish`**
- Accepts: `{ items: [{sku, name, price, currency, ...}] }`
- Auth: Requires `commerce.publish` role
- Action: Enqueue background job
- Returns: 202 Accepted with job ID

**4. `GET /enterprise/market/history`**
- Returns: `{ runs: [{ started_at, count, status, errors }] }`
- Auth: Requires `commerce.read` role
- Pagination: Optional query params (limit, offset)

**Implementation Status:** ⏳ Pending (Backend team)

---

## F) Dev vs Live (Environment Parity)

### `.env.development`
```bash
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### `.env.production`
```bash
NEXT_PUBLIC_ENV=prod
NEXT_PUBLIC_API_URL=https://api.tregu.com
```

### Feature Flags (Both Environments)
```json
{
  "enterprise_nav_customization": true,
  "market_publish": true,
  "catalog_upload": true
}
```

### Deployment Pipeline
1. Build images (web/api) for Staging
2. Run smoke tests:
   - ✅ `/enterprise` shows Enterprise header only (global nav removed)
   - ✅ Tenant navbar renders from default config
   - ✅ Admin can customize nav; changes persist
   - ✅ Market Publishing tile/button appears when flag enabled
   - ✅ Upload → validate → publish → history workflow
3. Promote with blue/green deployment
4. Flip traffic
5. Monitor metrics
6. Rollback if needed

---

## G) Non-Negotiable Styling and Safety

### Style Requirements
- ✅ No emojis anywhere (lint + pre-commit grep)
- ✅ Neutral palette; monochrome outline SVG icons
- ✅ Enterprise buttons/inputs use defined styles
- ✅ Print views: black icons, no shadows
- ⏳ Consistent 18px icon size in navbar
- ⏳ Hover states on nav items (text-brand-700, bg-slate-50)

### Security Requirements
- ⏳ Role-based access control on all admin endpoints
- ⏳ CSRF protection on PUT/POST requests
- ⏳ Input sanitization (XSS prevention)
- ⏳ Rate limiting on publish endpoint

---

## H) Acceptance Criteria (QA Checklist)

### Global Nav Removal
- [ ] Global nav is absent on all `/enterprise/*` pages
- [ ] Enterprise layout renders its own header
- [ ] Logo links to `/enterprise` (not `/dashboard`)

### Tenant Navbar
- [ ] Navbar renders from tenant config (or defaults if none saved)
- [ ] Only visible items appear
- [ ] Role filtering works (finance.read, admin.manage, commerce.read)
- [ ] Icons render at 18px with proper spacing
- [ ] External links open in new tab with ↗ indicator

### Admin Customization
- [ ] Admins see "Customize" button in Enterprise header
- [ ] Clicking "Customize" navigates to `/enterprise/admin/navigation`
- [ ] Can add/remove/reorder items via up/down buttons
- [ ] Can edit label, href, icon, roles
- [ ] Emoji validation prevents save with descriptive error
- [ ] Invalid href validation prevents save
- [ ] Changes persist to backend
- [ ] Navbar updates immediately after save

### Market Publishing
- [ ] "Publish to Market" button appears when `market_publish=true`
- [ ] Market tile appears in system grid when flag enabled
- [ ] Upload workflow accepts CSV/XLSX/JSON
- [ ] Field mapping auto-detects sku, name, price, currency
- [ ] Validation checks required fields
- [ ] Publish button sends data to backend
- [ ] History page shows publish runs with status

### Dev/Live Parity
- [ ] Same code runs in both environments
- [ ] Only env vars and tenant data differ
- [ ] Feature flags work identically
- [ ] Backend endpoints use correct URL per env

---

## I) File Checklist

### New Files to Create
- [ ] `types/nav.ts` - NavItem and NavConfig types
- [ ] `lib/enterprise-default-nav.ts` - Default nav config
- [ ] `icons/tregu/HomeIcon.tsx` - Home icon component
- [ ] `app/enterprise/layout.tsx` - Enterprise layout with navbar
- [ ] `app/enterprise/admin/navigation/page.tsx` - Customize nav UI
- [ ] `app/api/enterprise/nav/route.ts` - GET/PUT nav config

### Files to Modify
- [ ] `icons/tregu/index.ts` - Add 'home' key to registry
- [ ] `app/api/enterprise/flags/route.ts` - Add `enterprise_nav_customization` flag

### Files Already Complete ✅
- ✅ `lib/icon-tokens.ts` - Icon design tokens
- ✅ `icons/tregu/*.tsx` - 13 custom icon components
- ✅ `components/SystemCard.tsx` - Icon integration
- ✅ `app/globals.css` - Print CSS
- ✅ `app/enterprise/market/*.tsx` - Market Publishing pages
- ✅ `app/api/enterprise/market/*.ts` - Market Publishing APIs

---

## J) Dependencies

### External Packages (Already Installed)
- ✅ `swr@^2.x` - Data fetching for history page
- ✅ `next@15.5.5` - Framework
- ✅ `react@^18` - UI library

### Internal Dependencies
- Custom icon system (`/icons/tregu`)
- RBAC utility functions (`/lib/flags.ts`)
- Type definitions (`/types/enterprise.ts`, `/types/nav.ts`)

---

## K) Testing Strategy

### Unit Tests
- NavConfig validation (emoji, href format)
- Role filtering logic (canSee function)
- Icon registry lookups

### Integration Tests
- GET /api/enterprise/nav returns defaults on backend failure
- PUT /api/enterprise/nav validates and forwards to backend
- Enterprise layout fetches and renders nav config

### E2E Tests
1. Login as admin
2. Navigate to /enterprise
3. Verify navbar renders default items
4. Click "Customize"
5. Add new link, reorder, change label
6. Save
7. Verify navbar updates
8. Logout, login as non-admin
9. Verify "Customize" button hidden
10. Verify role-filtered items only

### Smoke Tests (Production)
- /enterprise loads without errors
- Navbar renders within 200ms
- Market Publishing workflow completes
- No console errors

---

## L) Rollout Plan

### Phase 1: Development (Current)
- ✅ Icon system complete
- ✅ Market Publishing complete
- ⏳ Navbar implementation

### Phase 2: Staging (Next Week)
- Deploy to staging environment
- Run full QA checklist
- Load test navbar API (1000 req/s)
- Test blue/green deployment

### Phase 3: Production (Week After)
- Blue/green deploy to production
- Monitor error rates, latency
- Gradual rollout (10% → 50% → 100%)
- Rollback plan ready

---

## M) Success Metrics

### Performance
- Navbar renders in < 200ms
- API response time < 100ms (p95)
- Zero layout shift on nav render

### Adoption
- 80% of enterprise tenants customize navbar within 30 days
- 90% of admins use Customize feature at least once

### Quality
- Zero emoji regression (blocked by linting)
- < 1% error rate on navbar API
- 100% uptime during deployment

---

## N) Open Questions

1. **Role Source:** Where do we fetch user roles? (JWT claims, session, API call?)
2. **Icon Limit:** Max number of nav items per tenant? (Recommend 15)
3. **External Link Security:** Do we need to whitelist external domains?
4. **Audit Log:** Should we log all nav config changes? (Recommend yes)
5. **Versioning:** Do we need to version nav configs for rollback? (Nice to have)

---

## O) Contact & Escalation

**Frontend Lead:** [Your Name]  
**Backend Lead:** [Backend Team]  
**QA Lead:** [QA Team]  
**Stakeholder:** Enterprise Product Manager

**Escalation Path:**
1. Frontend/Backend sync (daily standup)
2. PM review (weekly)
3. CTO approval (major changes)

---

## End of Implementation Packet
**Next Steps:** Begin Phase 1 implementation starting with nav types and default config.
