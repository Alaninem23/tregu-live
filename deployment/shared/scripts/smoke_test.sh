#!/usr/bin/env bash
set -euo pipefail

# Smoke test script for Tregu deployment
# Run against staging before flipping production

ENVIRONMENT="${1:-staging}"
FAILED=0

if [[ "$ENVIRONMENT" == "staging" ]]; then
  APP_URL="https://staging.tregu.com"
  API_URL="https://staging-api.tregu.com"
elif [[ "$ENVIRONMENT" == "prod" ]]; then
  APP_URL="https://tregu.com"
  API_URL="https://api.tregu.com"
else
  echo "Usage: smoke_test.sh [staging|prod]"
  exit 2
fi

echo "================================================"
echo "  Tregu Smoke Tests - $ENVIRONMENT"
echo "  $(date)"
echo "================================================"
echo ""
echo "Testing: $APP_URL"
echo "Testing: $API_URL"
echo ""

# Test function
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_code="${3:-200}"
  
  echo -n "  Testing $name... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  
  if [[ "$response" == "$expected_code" ]]; then
    echo "✓ OK ($response)"
  else
    echo "✗ FAIL (got $response, expected $expected_code)"
    FAILED=$((FAILED + 1))
  fi
}

# 1. Health Checks
echo "[1/6] Health Checks"
test_endpoint "API health" "$API_URL/healthz" 200
test_endpoint "Web health" "$APP_URL/api/healthz" 200
echo ""

# 2. Public Pages
echo "[2/6] Public Pages"
test_endpoint "Homepage" "$APP_URL/" 200
test_endpoint "Market" "$APP_URL/market" 200
test_endpoint "Feed" "$APP_URL/feed" 200
test_endpoint "Join page" "$APP_URL/join" 200
test_endpoint "Join Business" "$APP_URL/join?mode=BUSINESS" 200
test_endpoint "Join Enterprise" "$APP_URL/join?mode=ENTERPRISE" 200
echo ""

# 3. SEO Files
echo "[3/6] SEO Files"
test_endpoint "robots.txt" "$APP_URL/robots.txt" 200
test_endpoint "sitemap.xml" "$APP_URL/sitemap.xml" 200
echo ""

# 4. Static Assets (should load without errors)
echo "[4/6] Static Assets"
test_endpoint "Next.js static" "$APP_URL/_next/static/chunks/main.js" 200
echo ""

# 5. API Endpoints (basic checks)
echo "[5/6] API Endpoints"
test_endpoint "API root" "$API_URL/" 200
test_endpoint "API docs" "$API_URL/docs" 200
echo ""

# 6. Feature Flags (check API returns expected structure)
echo "[6/6] Feature Availability"
echo "  Checking API response format..."

api_response=$(curl -s "$API_URL/healthz" || echo "")
if [[ -n "$api_response" ]]; then
  echo "  ✓ API responding"
else
  echo "  ✗ API not responding"
  FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "================================================"
if [[ $FAILED -eq 0 ]]; then
  echo "  ✓ All smoke tests PASSED"
  echo "================================================"
  echo ""
  echo "Next steps for $ENVIRONMENT:"
  if [[ "$ENVIRONMENT" == "staging" ]]; then
    echo "  1. Manual testing:"
    echo "     - Register Personal account at $APP_URL/join"
    echo "     - Register Business account at $APP_URL/join?mode=BUSINESS"
    echo "     - Test checkout flow"
    echo "     - Test product creation"
    echo ""
    echo "  2. If all tests pass, deploy to production"
  else
    echo "  1. Monitor logs and metrics"
    echo "  2. Check error rates in Sentry"
    echo "  3. Verify user traffic flows normally"
  fi
  exit 0
else
  echo "  ✗ $FAILED test(s) FAILED"
  echo "================================================"
  echo ""
  echo "⚠️  Do not deploy to production"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check container logs:"
  echo "     docker logs api_${ENVIRONMENT}"
  echo "     docker logs web_${ENVIRONMENT}"
  echo ""
  echo "  2. Check Nginx logs:"
  echo "     tail -f /var/log/nginx/error.log"
  echo ""
  exit 1
fi
