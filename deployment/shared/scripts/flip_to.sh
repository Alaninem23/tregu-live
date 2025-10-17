#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"

if [[ "$TARGET" != "blue" && "$TARGET" != "green" ]]; then
  echo "Usage: flip_to.sh [blue|green]"
  echo ""
  echo "Examples:"
  echo "  flip_to.sh green   # Switch to green deployment"
  echo "  flip_to.sh blue    # Switch to blue deployment"
  exit 2
fi

CONF="/srv/tregu/shared/nginx/tregu.conf"

echo "================================================"
echo "  Flipping traffic to $TARGET - $(date)"
echo "================================================"

if [[ "$TARGET" == "blue" ]]; then
  echo ""
  echo "Updating Nginx config to route to BLUE..."
  
  # API upstream: enable blue, disable green
  sed -i 's/server 127\.0\.0\.1:8002;/# server 127.0.0.1:8002;  # api_green (STANDBY)/' "$CONF"
  sed -i 's/# server 127\.0\.0\.1:8001;.*/server 127.0.0.1:8001;    # api_blue (ACTIVE)/' "$CONF"
  
  # Web upstream: enable blue, disable green
  sed -i 's/server 127\.0\.0\.1:3002;/# server 127.0.0.1:3002;  # web_green (STANDBY)/' "$CONF"
  sed -i 's/# server 127\.0\.0\.1:3001;.*/server 127.0.0.1:3001;    # web_blue (ACTIVE)/' "$CONF"
  
else  # green
  echo ""
  echo "Updating Nginx config to route to GREEN..."
  
  # API upstream: disable blue, enable green
  sed -i 's/server 127\.0\.0\.1:8001;/# server 127.0.0.1:8001;  # api_blue (STANDBY)/' "$CONF"
  sed -i 's/# server 127\.0\.0\.1:8002;.*/server 127.0.0.1:8002;    # api_green (ACTIVE)/' "$CONF"
  
  # Web upstream: disable blue, enable green
  sed -i 's/server 127\.0\.0\.1:3001;/# server 127.0.0.1:3001;  # web_blue (STANDBY)/' "$CONF"
  sed -i 's/# server 127\.0\.0\.1:3002;.*/server 127.0.0.1:3002;    # web_green (ACTIVE)/' "$CONF"
fi

echo ""
echo "Testing Nginx config..."
nginx -t

if [[ $? -eq 0 ]]; then
  echo ""
  echo "Reloading Nginx..."
  systemctl reload nginx
  
  echo ""
  echo "================================================"
  echo "  ✓ Traffic flipped to $TARGET"
  echo "================================================"
  echo ""
  echo "Monitor live traffic:"
  echo "  tail -f /var/log/nginx/access.log"
  echo ""
  echo "Check health:"
  echo "  curl https://api.tregu.com/healthz"
  echo "  curl https://tregu.com/healthz"
  echo ""
else
  echo ""
  echo "✗ Nginx config test FAILED - not reloading"
  exit 3
fi
