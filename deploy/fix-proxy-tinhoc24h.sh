#!/bin/bash
# Sua proxy Apache cho thangtinhoc.edu.vn
# Chay tren VPS (root): bash deploy/fix-proxy-thangtinhoc.sh

set -euo pipefail

DOMAIN="${DOMAIN:-thangtinhoc.edu.vn}"
ROOT="${ROOT:-/www/wwwroot/thangtinhoc}"
PORT="${PORT:-5002}"

PROXY_BLOCK="# thangtinhoc API proxy (auto-added)
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  ProxyPass /api http://127.0.0.1:${PORT}/api
  ProxyPassReverse /api http://127.0.0.1:${PORT}/api
  ProxyPass /uploads http://127.0.0.1:${PORT}/uploads
  ProxyPassReverse /uploads http://127.0.0.1:${PORT}/uploads
  ProxyPass /sitemap.xml http://127.0.0.1:${PORT}/sitemap.xml
  ProxyPassReverse /sitemap.xml http://127.0.0.1:${PORT}/sitemap.xml
  ProxyPass /robots.txt http://127.0.0.1:${PORT}/robots.txt
  ProxyPassReverse /robots.txt http://127.0.0.1:${PORT}/robots.txt
</IfModule>"

echo "========== 1. Kiem tra backend :${PORT} =========="
if curl -sf "http://127.0.0.1:${PORT}/api/health" >/dev/null; then
  echo "OK: backend tra ve /api/health"
  curl -s "http://127.0.0.1:${PORT}/api/health"
  echo ""
else
  echo "FAIL: backend khong phan hoi tai :${PORT}"
  echo "Kiem tra: pm2 list && pm2 logs thangtinhoc-api --lines 30"
  exit 1
fi

echo ""
echo "========== 2. Tim file cau hinh Apache =========="
VHOST=""
for dir in /www/server/panel/vhost/apache /etc/apache2/sites-enabled /etc/httpd/conf.d; do
  if [ -d "$dir" ]; then
    found=$(grep -rl "ServerName.*${DOMAIN}\|server_name.*${DOMAIN}" "$dir" 2>/dev/null | head -1 || true)
    if [ -n "$found" ]; then
      VHOST="$found"
      break
    fi
  fi
done

if [ -z "$VHOST" ]; then
  VHOST=$(grep -rl "${DOMAIN}" /www/server/panel/vhost/apache/ 2>/dev/null | head -1 || true)
fi

if [ -z "$VHOST" ] || [ ! -f "$VHOST" ]; then
  echo "Khong tim thay VirtualHost cho ${DOMAIN}"
  echo "Thu cau hinh thu cong trong aaPanel:"
  echo "  Proxy dir /api  -> http://127.0.0.1:${PORT}"
  echo "  Proxy dir /uploads -> http://127.0.0.1:${PORT}"
  exit 1
fi

echo "Tim thay: $VHOST"

echo ""
echo "========== 3. Chen / cap nhat ProxyPass =========="
cp "$VHOST" "${VHOST}.bak.$(date +%Y%m%d%H%M%S)"

if grep -q "thangtinhoc API proxy" "$VHOST"; then
  echo "Da co proxy block — cap nhat port ${PORT}"
  sed -i "s|ProxyPass /api http://127.0.0.1:[0-9]*/api|ProxyPass /api http://127.0.0.1:${PORT}/api|g" "$VHOST"
  sed -i "s|ProxyPassReverse /api http://127.0.0.1:[0-9]*/api|ProxyPassReverse /api http://127.0.0.1:${PORT}/api|g" "$VHOST"
  sed -i "s|ProxyPass /uploads http://127.0.0.1:[0-9]*/uploads|ProxyPass /uploads http://127.0.0.1:${PORT}/uploads|g" "$VHOST"
  sed -i "s|ProxyPassReverse /uploads http://127.0.0.1:[0-9]*/uploads|ProxyPassReverse /uploads http://127.0.0.1:${PORT}/uploads|g" "$VHOST"
elif grep -q "ProxyPass.*/api" "$VHOST"; then
  echo "Da co ProxyPass /api — kiem tra port trong file:"
  grep "ProxyPass.*/api" "$VHOST" || true
else
  echo "Chen proxy block truoc </VirtualHost>"
  awk -v block="$PROXY_BLOCK" '
    /<\/VirtualHost>/ && !done {
      print block
      done=1
    }
    { print }
  ' "$VHOST" > "${VHOST}.tmp" && mv "${VHOST}.tmp" "$VHOST"
fi

echo ""
echo "========== 4. Reload Apache =========="
if command -v bt >/dev/null 2>&1; then
  bt reload 2>/dev/null || /etc/init.d/httpd reload 2>/dev/null || systemctl reload httpd 2>/dev/null || systemctl reload apache2 2>/dev/null
else
  /etc/init.d/httpd reload 2>/dev/null || systemctl reload httpd 2>/dev/null || systemctl reload apache2 2>/dev/null || apachectl graceful 2>/dev/null
fi
echo "Apache da reload"

echo ""
echo "========== 5. Kiem tra qua domain =========="
sleep 2
REMOTE=$(curl -s "https://${DOMAIN}/api/health" | head -c 200)
echo "$REMOTE"
echo ""

if echo "$REMOTE" | grep -q '"status"'; then
  echo "THANH CONG: /api/health tra JSON qua domain"
  echo "Mo trinh duyet Ctrl+Shift+R tai https://${DOMAIN}/login"
else
  echo "VAN LOI: domain chua proxy dung"
  echo "Xem file: $VHOST"
  echo "Hoac aaPanel -> Website -> ${DOMAIN} -> Proxy nguoc -> /api -> http://127.0.0.1:${PORT}"
fi
