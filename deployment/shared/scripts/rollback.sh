#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "  ROLLBACK TO BLUE - $(date)"
echo "================================================"
echo ""
echo "⚠️  Rolling traffic back to BLUE deployment"
echo ""

/srv/tregu/shared/scripts/flip_to.sh blue

if [[ $? -eq 0 ]]; then
  echo ""
  echo "================================================"
  echo "  ✓ Rollback complete - Blue is live"
  echo "================================================"
  echo ""
  echo "Next steps:"
  echo "  1. Verify traffic restored:"
  echo "     curl https://api.tregu.com/healthz"
  echo "     curl https://tregu.com/healthz"
  echo ""
  echo "  2. Investigate green issues:"
  echo "     docker logs api_green"
  echo "     docker logs web_green"
  echo ""
  echo "  3. Fix issues and redeploy when ready:"
  echo "     /srv/tregu/shared/scripts/deploy_green.sh"
  echo ""
else
  echo ""
  echo "✗ Rollback FAILED - manual intervention required"
  exit 1
fi
