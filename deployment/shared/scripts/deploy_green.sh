#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "  Tregu Green Deployment - $(date)"
echo "================================================"

cd /srv/tregu/green

echo ""
echo "[1/3] Pulling latest images..."
docker compose pull

echo ""
echo "[2/3] Starting green stack..."
docker compose up -d

echo ""
echo "[3/3] Waiting for health checks..."
for svc in api_green web_green; do
  echo ""
  echo "  Checking $svc..."
  for i in {1..60}; do
    status=$(docker inspect --format='{{json .State.Health.Status}}' "$svc" 2>/dev/null || echo '"starting"')
    
    if [[ $status == "\"healthy\"" ]]; then
      echo "    ✓ $svc is HEALTHY"
      break
    elif [[ $status == "\"unhealthy\"" ]]; then
      echo "    ✗ $svc is UNHEALTHY - check logs:"
      docker logs --tail 50 "$svc"
      exit 1
    fi
    
    echo -n "."
    sleep 2
    
    if [[ $i -eq 60 ]]; then
      echo ""
      echo "    ✗ TIMEOUT waiting for $svc to become healthy"
      echo "    Last status: $status"
      echo "    Container logs:"
      docker logs --tail 50 "$svc"
      exit 1
    fi
  done
done

echo ""
echo "================================================"
echo "  ✓ Green stack is HEALTHY and ready"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Test green endpoints:"
echo "     - API:  curl http://localhost:8002/healthz"
echo "     - Web:  curl http://localhost:3002/api/healthz"
echo ""
echo "  2. Run smoke tests against green"
echo ""
echo "  3. Flip traffic to green:"
echo "     /srv/tregu/shared/scripts/flip_to.sh green"
echo ""
echo "  4. If issues arise, rollback:"
echo "     /srv/tregu/shared/scripts/rollback.sh"
echo ""
