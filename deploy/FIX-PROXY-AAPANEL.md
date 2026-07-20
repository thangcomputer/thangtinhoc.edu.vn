# Sua loi "Route not found" khi dang nhap admin (aaPanel)

Loi **404 Route not found** tren `https://thangtinhoc.edu.vn/api/auth/login` nghia la **Apache khong chuyen `/api` sang Node** (hoac chuyen sai duong dan).

## Kiem tra nhanh (chay tren VPS)

```bash
cd /www/wwwroot/thangtinhoc
bash deploy/check-vps.sh
```

| Ket qua | Nguyen nhan |
|---------|-------------|
| `:5001` OK, domain FAIL | Proxy Apache / aaPanel sai |
| Ca hai FAIL `auth/ping` | Chua `git pull` hoac PM2 chay code cu |
| `path` trong JSON la `/api/api/...` | URL dich proxy co them `/api` thua |
| `path` la `/api//health` hoac `/api//auth/login` | URL dich co **slash cuoi** (`...5001/api/`) — xoa slash cuoi |

**Luu y:** Server moi (sau `git pull`) tu sua path `//` thanh `/`. Van nen sua proxy de tranh loi khac.

## Cach 1 — Proxy trong aaPanel (UI)

1. **Trang web** → site `thangtinhoc.edu.vn` → **Proxy ngược**
2. **Xoa het** proxy cu (dac biet proxy dir `/` hoac URL co `https://127.0.0.1`)
3. **Them moi:**

| Duong dan (Proxy dir) | URL dich |
|----------------------|----------|
| `/api` | `http://127.0.0.1:5001` |
| `/uploads` | `http://127.0.0.1:5001` |
| `/sitemap.xml` | `http://127.0.0.1:5001` |
| `/robots.txt` | `http://127.0.0.1:5001` |

**KHONG** dung:
- `https://127.0.0.1:5001` (Node khong co SSL local)
- `http://127.0.0.1:5001/api` khi Proxy dir da la `/api` (thanh `/api/api/...`)
- Proxy dir `/` (proxy ca website)

4. Luu → reload Apache

## Cach 2 — Chen Apache (on dinh hon)

1. Xoa proxy trong UI (tranh trung cau hinh)
2. **Trang web** → **Cau hinh** (Configuration) → tim `</VirtualHost>`
3. Chen **truoc** dong do noi dung file `deploy/apache/aapanel-api-proxy.conf`:

```apache
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  ProxyPass /api http://127.0.0.1:5001/api
  ProxyPassReverse /api http://127.0.0.1:5001/api
  ProxyPass /uploads http://127.0.0.1:5001/uploads
  ProxyPassReverse /uploads http://127.0.0.1:5001/uploads
  ProxyPass /sitemap.xml http://127.0.0.1:5001/sitemap.xml
  ProxyPassReverse /sitemap.xml http://127.0.0.1:5001/sitemap.xml
  ProxyPass /robots.txt http://127.0.0.1:5001/robots.txt
  ProxyPassReverse /robots.txt http://127.0.0.1:5001/robots.txt
</IfModule>
```

4. Luu → reload Apache

## Sau khi sua proxy

```bash
cd /www/wwwroot/thangtinhoc
git pull origin main
cp deploy/apache/site_dist.htaccess site_dist/.htaccess
pm2 restart thangtinhoc-api
```

Kiem tra phai co JSON (khong phai HTML):

```bash
curl -s https://thangtinhoc.edu.vn/api/auth/ping
curl -s -X POST https://thangtinhoc.edu.vn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123","deviceId":"0123456789abcdef"}' | head -c 150
```

Kiem tra SEO (phai thay XML / text, KHONG phai HTML SPA):

```bash
curl -sI https://thangtinhoc.edu.vn/sitemap.xml | head -5
curl -s https://thangtinhoc.edu.vn/sitemap.xml | head -20
curl -s https://thangtinhoc.edu.vn/robots.txt
```

Neu thay `"token"` → mo trinh duyet **Ctrl+Shift+R** tai `/admin/login`.

## server/.env tren VPS

```env
SERVE_FRONTEND=false
JWT_SECRET=<chuoi dai ngau nhien>
CORS_ORIGIN=https://thangtinhoc.edu.vn,https://www.thangtinhoc.edu.vn
PORT=5001
```
