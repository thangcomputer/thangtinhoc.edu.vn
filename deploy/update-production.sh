#!/bin/bash
# Cap nhat web production = code tren GitHub (main)
# Chay tren VPS: bash deploy/update-production.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Git pull..."
git fetch origin main
git pull origin main

echo "==> Kiem tra GOOGLE_CLIENT_ID trong server/.env..."
if ! grep -qE '^GOOGLE_CLIENT_ID=.+' server/.env 2>/dev/null; then
  echo "CANH BAO: Chua co GOOGLE_CLIENT_ID trong server/.env"
  echo "  Them dong: GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com"
fi

echo "==> API: migrate + restart..."
cd server
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
npx prisma generate
npx prisma migrate deploy
cd ..

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart thangtinhoc-api 2>/dev/null || pm2 restart all
else
  echo "CANH BAO: pm2 khong tim thay — hay restart API thu cong"
fi

echo "==> Build frontend (site_dist)..."
bash deploy/rebuild-frontend.sh

echo "==> Seed MOS/IC3 blog posts (if script exists)..."
if [ -f server/scripts/seed-mos-ic3-posts.cjs ]; then
  (cd server && node scripts/seed-mos-ic3-posts.cjs) || echo "CANH BAO: seed MOS/IC3 that bai — chay lai: cd server && node scripts/seed-mos-ic3-posts.cjs"
fi

echo ""
echo "=========================================="
echo " XONG! Kiem tra:"
echo "   https://thangtinhoc.edu.vn/"
echo "   https://thangtinhoc.edu.vn/login"
echo "   https://thangtinhoc.edu.vn/admin/login"
echo ""
echo " aaPanel: Thu muc web = $ROOT/site_dist"
echo " Trinh duyet: Ctrl+Shift+R (xoa cache)"
echo "=========================================="
