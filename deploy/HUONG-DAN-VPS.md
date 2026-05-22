# Huong dan deploy len VPS (admin tai /admin)

## URL dung
- Website: `https://thangtinhoc.edu.vn/`
- Admin: `https://thangtinhoc.edu.vn/admin/login` (cung domain, **khong** dung `admin.thangtinhoc.edu.vn`)

## Loai loi thuong gap
Truy cap `/admin/login` ma thay trang chu client → **Thu muc web sai** (dang tro `client/dist` thay vi `site_dist`).

Kiem tra nhanh tren VPS:
```bash
curl -s https://thangtinhoc.edu.vn/admin/login | grep -o 'src="[^"]*"'
# Phai thay: src="/admin/assets/....js"
# Sai neu thay: src="/assets/....js"
```

## Cap nhat web = GitHub (QUAN TRONG)

**Push len GitHub khong tu dong len web.** Phai chay tren VPS:

```bash
cd /www/wwwroot/thangtinhoc   # hoac APP_DIR cua ban
bash deploy/update-production.sh
```

Hoac tung buoc:

```bash
cd /www/wwwroot/thangtinhoc
git pull origin main

# Google login (them 1 lan neu chua co)
nano server/.env
# GOOGLE_CLIENT_ID=472584566291-hh7r4rpo8tedqvfb10qgpv27a71a3hds.apps.googleusercontent.com

cd server && npm ci --omit=dev && npx prisma migrate deploy
pm2 restart thangtinhoc-api

cd ..
bash deploy/rebuild-frontend.sh
```

Sau do trinh duyet: **Ctrl+Shift+R** (hard refresh).

### Loi `vite: command not found` khi build

Code da pull dung nhung chua cai npm trong `client/` va `admin/`. Chay:

```bash
cd /www/wwwroot/thangtinhoc
(cd client && npm ci || npm install)
(cd admin && npm ci || npm install)
bash deploy/rebuild-frontend.sh
```

(Script `rebuild-frontend.sh` tu ban moi se tu chay `npm install` truoc build.)

### Loi lightningcss `Unexpected token` tai `.cookie-consent`

File CSS bi luu UTF-16 (thuong `CookieConsent.css`). Tren may dev:

```bash
npm run fix:encoding
git add client/src/components/CookieConsent.css
git commit -m "fix: CookieConsent.css UTF-8 encoding for Vite build"
git push
```

Tren VPS: `git pull` roi `bash deploy/rebuild-frontend.sh`

Kiem tra da pull dung commit:
```bash
git log -1 --oneline
# Phai thay: dbaf741 hoac moi hon
```

## aaPanel (Apache) — bat buoc
1. **Website** → **Thu muc web** = `/www/wwwroot/thangtinhoc/site_dist`  
   (KHONG dung `client/dist` hay `admin/dist` rieng)
2. **Reverse proxy** (trong cau hinh site):
   - `/api` → `http://127.0.0.1:5001` (port trong `deploy/deploy.conf`)
   - `/uploads` → `http://127.0.0.1:5001`
3. Bat **Allow .htaccess** / rewrite (Apache: `mod_rewrite` on)
4. File rewrite (sau `bash deploy/rebuild-frontend.sh`):
   - `site_dist/.htaccess`
   - `site_dist/admin/.htaccess`
   - `site_dist/admin/login/index.html` (fallback neu rewrite tat)
5. Neu van 404, chay tay:
   ```bash
   cp deploy/apache/site_dist.htaccess site_dist/.htaccess
   cp deploy/apache/admin.htaccess site_dist/admin/.htaccess
   mkdir -p site_dist/admin/login && cp site_dist/admin/index.html site_dist/admin/login/index.html
   ```
6. aaPanel: **Allow .htaccess** / bat **Rewrite** cho site
7. Reload web server, Ctrl+Shift+R

## PM2 logs — giai thich nhanh

| Log | Y nghia | Cach xu ly |
|-----|---------|------------|
| `GOOGLE_CLIENT_ID not set` | Chua co Google login tren VPS | Them vao `server/.env` (xem ben duoi) |
| `API key is invalid` (Resend) | `RESEND_API_KEY` sai hoac trong | Lay key moi tai resend.com → `server/.env` |
| `[AUDIT-FAIL] AUTH FAILED` | Sai mat khau khi dang nhap | Binh thuong; khong phai loi server |
| `Admin SPA: .../admin/dist` | Node dang serve SPA (aaPanel nen dung `site_dist`) | Dat `SERVE_FRONTEND=false` trong `server/.env` |

Sau khi sua `.env`:

```bash
pm2 restart thangtinhoc-api
pm2 logs thangtinhoc-api --lines 20
```

### server/.env tren VPS (vi du)

```env
GOOGLE_CLIENT_ID=472584566291-hh7r4rpo8tedqvfb10qgpv27a71a3hds.apps.googleusercontent.com
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=noreply@thangtinhoc.vn
SERVE_FRONTEND=false
```

**Luu y:** Khong commit file `.env` len GitHub. Chi sua tren VPS.

## Dang nhap admin
- Email: `admin@thangtinhoc.vn`
- Mat khau: `admin123` (neu da seed)
- Neu quen mat khau: `cd server && node reset_pw.js`

## VPS moi
```bash
sudo bash deploy/setup-vps.sh
cd /www/wwwroot && git clone https://github.com/thangcomputer/THANGTINHOC.git thangtinhoc
cd thangtinhoc && cp deploy/deploy.conf.example deploy/deploy.conf
nano deploy/deploy.conf
sudo bash deploy/deploy.sh
```
