# Tregu Account Types & Enterprise System - Testing Guide

## Test Environment Setup

**Development Server**: http://localhost:3000  
**Environment Indicator**: Should show "Dev" badge in header (yellow badge)  
**Date**: October 16, 2025

---

## Backend Integration Smoke Tests (Local, no Docker)

Use this quick check to validate enterprise ingestion flows independently of the frontend.

Steps (PowerShell):
- From repo root: `powershell -NoProfile -ExecutionPolicy Bypass -File .\tregu_backend\tools\run_smoke.ps1`
- The script will start the API on http://127.0.0.1:8003, then run upload → map-validate → apply for inventory, customers, and orders using the CSV templates in `tregu_frontend/public/templates`.
- On success it prints the batch IDs and canonical counts via GET `/api/integration/debug/counts`.

Expected results (templates):
- errors=0 for all three domains; applied=True
- counts: inventory=2, customers=1, orders=1, order_lines=2

Troubleshooting:
- Ensure rate limiter is disabled for local: `ENABLE_RATE_LIMIT=0` (default in app startup)
- If a port is in use, stop other uvicorn/node processes before running.

## Test Suite 1: PERSONAL Account Flow

### 1.1 Registration
- [ ] Navigate to `/join`
- [ ] Verify "PERSONAL" is selected by default
- [ ] Fill in email, password, name
- [ ] Check "I agree" checkbox
- [ ] Click "Create Account"
- [ ] **Expected**: Redirect to `/market`

### 1.2 Capabilities Verification
- [ ] Navigate to `/business/catalog`
- [ ] **Expected**: "Add Product" button is disabled or shows capability restriction message
- [ ] Navigate to `/market`
- [ ] **Expected**: Can view PUBLIC products
- [ ] **Expected**: Cannot see ORG_ONLY products from other organizations

### 1.3 API Guards
- [ ] Open browser DevTools Console
- [ ] Try POST to `/api/catalog/post` with product data
  ```javascript
  fetch('/api/catalog/post', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({title: 'Test', price: 100, productVisibility: 'PUBLIC'})
  }).then(r => r.json()).then(console.log)
  ```
- [ ] **Expected**: 403 Forbidden with message: "Only BUSINESS and ENTERPRISE accounts can create products"

---

## Test Suite 2: BUSINESS Account Flow

### 2.1 Registration
- [ ] Navigate to `/join?mode=BUSINESS`
- [ ] Verify "BUSINESS" is pre-selected
- [ ] Fill in email, password, name
- [ ] Select tier (Starter/Standard/Pro)
- [ ] Check "I agree" checkbox
- [ ] Click "Create Account"
- [ ] **Expected**: Redirect to `/business/catalog`

### 2.2 Product Creation
- [ ] On business catalog page, verify "Add Product" button is enabled
- [ ] Click "Add Product"
- [ ] Fill in title, description, price
- [ ] **Expected**: NO visibility selector (BUSINESS accounts always create PUBLIC products)
- [ ] Submit product
- [ ] **Expected**: Product appears in catalog

### 2.3 Product Visibility
- [ ] Navigate to `/market` as BUSINESS user
- [ ] **Expected**: Can see own products
- [ ] **Expected**: Can see PUBLIC products from other sellers
- [ ] **Expected**: Cannot see ORG_ONLY products from ENTERPRISE orgs (unless member)

---

## Test Suite 3: ENTERPRISE Account Flow

### 3.1 Registration
- [ ] Navigate to `/join?mode=ENTERPRISE`
- [ ] Verify "ENTERPRISE" is pre-selected
- [ ] Fill in email, password, name
- [ ] Select "Enterprise" tier (Contact Us)
- [ ] Check "I agree" checkbox
- [ ] Click "Create Account"
- [ ] **Expected**: Redirect to `/enterprise` (NEW landing page)

### 3.2 Enterprise Landing Page
- [ ] Verify page shows "Tregu Enterprise" header
- [ ] Verify environment badge shows "Dev" (yellow)
- [ ] **Expected**: Grid of 12 system tiles visible:
  - Finance
  - Procure-to-Pay
  - Order-to-Cash
  - WMS
  - Manufacturing
  - TMS/Shipping
  - Planning
  - CRM & CPQ
  - Projects
  - Analytics
  - Integrations
  - Admin
- [ ] Click "Customize" button
- [ ] **Expected**: Modal opens with all systems listed
- [ ] Uncheck "Finance"
- [ ] Click "Close"
- [ ] **Expected**: Finance tile disappears from grid

### 3.3 System Navigation
- [ ] Click "WMS" tile
- [ ] **Expected**: Navigate to `/enterprise/wms`
- [ ] Verify breadcrumb shows: Enterprise › WMS
- [ ] Verify "Coming Soon" placeholder content
- [ ] Click "← Back to Enterprise Landing"
- [ ] **Expected**: Return to `/enterprise`

### 3.4 Policy Settings
- [ ] Navigate to `/enterprise/settings/policies`
- [ ] **Expected**: Page shows organization policy toggles:
  - Allow PERSONAL users to comment on your products
  - Allow PERSONAL users to transact with your org
  - Product visibility: PUBLIC / ORG_ONLY
- [ ] Toggle "Allow PERSONAL users to comment" to OFF
- [ ] Toggle "Product visibility" to ORG_ONLY
- [ ] Click "Save Changes"
- [ ] **Expected**: Success message appears

### 3.5 Product Creation with Visibility
- [ ] Navigate to `/business/catalog`
- [ ] Click "Add Product"
- [ ] Fill in title, description, price
- [ ] **Expected**: Visibility selector appears (PUBLIC / ORG_ONLY)
- [ ] Select "ORG_ONLY"
- [ ] Submit product
- [ ] **Expected**: Product saved with visibility setting

---

## Test Suite 4: Product Visibility Filtering

### 4.1 Setup
- [ ] Create ENTERPRISE account (User A)
- [ ] Create PUBLIC product as User A
- [ ] Create ORG_ONLY product as User A
- [ ] Create PERSONAL account (User B, different email)

### 4.2 Visibility Tests
- [ ] Log in as User B (PERSONAL)
- [ ] Navigate to `/market`
- [ ] **Expected**: Can see User A's PUBLIC product
- [ ] **Expected**: Cannot see User A's ORG_ONLY product
- [ ] Log in as User A (ENTERPRISE)
- [ ] Navigate to `/market`
- [ ] **Expected**: Can see own ORG_ONLY product
- [ ] **Expected**: Can see own PUBLIC product

### 4.3 Org Member Visibility
- [ ] Create second ENTERPRISE account (User C) with SAME orgId as User A
- [ ] Log in as User C
- [ ] Navigate to `/market`
- [ ] **Expected**: Can see User A's ORG_ONLY product (same org)
- [ ] **Expected**: Can see User A's PUBLIC product

---

## Test Suite 5: API Guards - Comments & Orders

### 5.1 Comment Restrictions
- [ ] Log in as PERSONAL user
- [ ] Navigate to ENTERPRISE product (PUBLIC)
- [ ] Try posting comment via API:
  ```javascript
  fetch('/api/comments', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({productId: 'PRODUCT_ID', content: 'Test comment'})
  }).then(r => r.json()).then(console.log)
  ```
- [ ] **Expected**: If ENTERPRISE org has `allowPersonalComments: false`, get 403 Forbidden
- [ ] **Expected**: If allowed, comment is created

### 5.2 Transaction Restrictions
- [ ] Log in as PERSONAL user
- [ ] Try creating order from ENTERPRISE seller:
  ```javascript
  fetch('/api/orders', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      productId: 'PRODUCT_ID',
      sellerId: 'SELLER_ID',
      quantity: 1,
      totalPrice: 100
    })
  }).then(r => r.json()).then(console.log)
  ```
- [ ] **Expected**: If ENTERPRISE org has `allowPersonalTransactions: false`, get 403 Forbidden
- [ ] **Expected**: If allowed, order is created

---

## Test Suite 6: Navigation & Logo Behavior

### 6.1 Non-Logged User
- [ ] Clear browser storage (logout)
- [ ] Navigate to `/market`
- [ ] Click Tregu logo
- [ ] **Expected**: Navigate to `/` (landing page)
- [ ] Click "Tregu" text link
- [ ] **Expected**: Navigate to `/` (landing page)

### 6.2 Logged-In User
- [ ] Log in as any account type
- [ ] Navigate to `/market`
- [ ] Click Tregu logo
- [ ] **Expected**: Navigate to `/dashboard`
- [ ] Click "Tregu" text link
- [ ] **Expected**: Navigate to `/dashboard`

---

## Test Suite 7: Environment Indicator

### 7.1 Development Environment
- [ ] Verify `.env.local` has: `NEXT_PUBLIC_ENV=dev`
- [ ] Restart dev server if needed
- [ ] Navigate to any page
- [ ] **Expected**: Yellow badge with "Dev" text in navbar
- [ ] Navigate to `/enterprise`
- [ ] **Expected**: Yellow badge with "Dev" text in enterprise header

### 7.2 Production Environment (Simulation)
- [ ] Update `.env.local` to: `NEXT_PUBLIC_ENV=prod`
- [ ] Restart dev server
- [ ] Navigate to any page
- [ ] **Expected**: Green badge with "Live" text in navbar
- [ ] Navigate to `/enterprise`
- [ ] **Expected**: Green badge with "Live" text in enterprise header

---

## Test Suite 8: Edge Cases & Error Handling

### 8.1 Missing Capabilities
- [ ] Log in as PERSONAL user
- [ ] Try accessing `/business/catalog` directly
- [ ] **Expected**: Can view page but "Add Product" is disabled
- [ ] Try accessing `/enterprise/settings/policies` directly
- [ ] **Expected**: Redirected or access denied (if implemented)

### 8.2 Invalid Routes
- [ ] Navigate to `/enterprise/invalid-system`
- [ ] **Expected**: Shows "Coming Soon" placeholder with system name
- [ ] Navigate to `/enterprise` without authentication
- [ ] **Expected**: Prompts for login or shows public message

### 8.3 Feature Flags
- [ ] Update `/api/enterprise/flags/route.ts`
- [ ] Set `fin_core: false`
- [ ] Restart server
- [ ] Log in as ENTERPRISE
- [ ] Navigate to `/enterprise`
- [ ] **Expected**: Finance tile does NOT appear
- [ ] Click "Customize"
- [ ] **Expected**: Finance shows "Disabled by admin"

---

## Acceptance Criteria Checklist

### Account Types
- [ ] PERSONAL users redirect to `/market` after registration
- [ ] BUSINESS users redirect to `/business/catalog` after registration
- [ ] ENTERPRISE users redirect to `/enterprise` after registration
- [ ] All account types have correct capability restrictions

### Enterprise Landing
- [ ] Enterprise landing shows all 12 system tiles
- [ ] Clicking tile navigates to `/enterprise/{system}`
- [ ] Customize modal allows hide/show
- [ ] Feature flags properly gate tile visibility
- [ ] RBAC enforces role requirements (Admin tile)

### Product Visibility
- [ ] PUBLIC products visible to all users
- [ ] ORG_ONLY products visible only to org members
- [ ] BUSINESS accounts create PUBLIC products only
- [ ] ENTERPRISE accounts can choose visibility

### API Guards
- [ ] Catalog/post API enforces `canPostProducts`
- [ ] Comments API enforces `canComment` + org policies
- [ ] Orders API enforces `canTransact` + org policies
- [ ] All 403 responses include descriptive error messages

### UI/UX
- [ ] Logo navigates to `/` for non-logged users
- [ ] Logo navigates to `/dashboard` for logged users
- [ ] Environment badge shows "Dev" (yellow) or "Live" (green)
- [ ] Badge appears in both navbar and enterprise header
- [ ] All pages load in <1s on modern desktop

---

## Known Issues / Future Enhancements

### To Fix
- None identified yet (pending test execution)

### Future Features (Phase 2)
- Drag-and-drop tile ordering
- Per-system quick actions on tiles
- Role-based dashboard widgets
- Global command palette
- Real-time collaboration indicators

---

## Test Execution Log

| Test Suite | Status | Tester | Date | Notes |
|------------|--------|--------|------|-------|
| 1. PERSONAL Flow | ⏳ Pending | - | - | - |
| 2. BUSINESS Flow | ⏳ Pending | - | - | - |
| 3. ENTERPRISE Flow | ⏳ Pending | - | - | - |
| 4. Visibility Filtering | ⏳ Pending | - | - | - |
| 5. API Guards | ⏳ Pending | - | - | - |
| 6. Navigation | ⏳ Pending | - | - | - |
| 7. Environment | ⏳ Pending | - | - | - |
| 8. Edge Cases | ⏳ Pending | - | - | - |

---

## Quick Test Commands (Browser DevTools)

```javascript
// Check current user
JSON.parse(localStorage.getItem('tregu:user'))

// Check auth token
localStorage.getItem('auth_token')

// Test product creation (BUSINESS/ENTERPRISE only)
fetch('/api/catalog/post', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    title: 'Test Product',
    description: 'Testing visibility',
    price: 99.99,
    productVisibility: 'PUBLIC',
    category: 'Electronics'
  })
}).then(r => r.json()).then(console.log)

// Test comment creation
fetch('/api/comments', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    productId: 'REPLACE_WITH_PRODUCT_ID',
    content: 'Great product!'
  })
}).then(r => r.json()).then(console.log)

// Test order creation
fetch('/api/orders', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    productId: 'REPLACE_WITH_PRODUCT_ID',
    sellerId: 'REPLACE_WITH_SELLER_ID',
    sellerEmail: 'seller@example.com',
    productTitle: 'Test Product',
    quantity: 1,
    totalPrice: 99.99
  })
}).then(r => r.json()).then(console.log)

// Check enterprise flags
fetch('/api/enterprise/flags').then(r => r.json()).then(console.log)

// Check enterprise prefs
fetch('/api/enterprise/prefs').then(r => r.json()).then(console.log)
```
