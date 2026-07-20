#!/bin/bash
# Chay tren VPS: bash deploy/check-vps.sh
set -e
ROOT="${ROOT:-/www/wwwroot/thangtinhoc}"
PORT="${PORT:-5001}"
DOMAIN="${DOMAIN:-https://thangtinhoc.edu.vn}"

echo "========== PM2 =========="
pm2 describe thangtinhoc-api 2>/dev/null | grep -E 'status|cwd|script path' || echo "PM2 app khong tim thay"

echo ""
echo "========== Git =========="
cd "$ROOT"
git log -1 --oneline

echo ""
echo "========== API truc tiep :$PORT =========="
curl -sf "http://127.0.0.1:$PORT/api/health" && echo "" || echo "FAIL health"
curl -sf "http://127.0.0.1:$PORT/api/auth/ping" && echo "" || echo "FAIL auth/ping (can git pull)"
curl -s -X POST "http://127.0.0.1:$PORT/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123","deviceId":"0123456789abcdef"}' | head -c 150
echo ""

echo ""
echo "========== Qua domain (Apache) =========="
curl -s "$DOMAIN/api/health" | head -c 120
echo ""
curl -s "$DOMAIN/api/auth/ping" | head -c 120
echo ""
curl -s -X POST "$DOMAIN/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123","deviceId":"0123456789abcdef"}' | head -c 200
echo ""

echo ""
echo "Neu auth/ping FAIL tren :$PORT -> git pull && pm2 restart thangtinhoc-api"
echo "Neu :$PORT OK nhung domain FAIL -> sua Apache ProxyPass (xem deploy/FIX-PROXY-AAPANEL.md)"
