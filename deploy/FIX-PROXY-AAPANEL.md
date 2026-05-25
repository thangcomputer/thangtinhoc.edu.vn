# Sua proxy aaPanel

## XOA proxy UI, dung Apache

1. Proxy nguoc -> Xoa het rule
2. Cau hinh site -> chen truoc </VirtualHost>:

ProxyPreserveHost On
ProxyPass /api http://127.0.0.1:5001/api
ProxyPassReverse /api http://127.0.0.1:5001/api
ProxyPass /uploads http://127.0.0.1:5001/uploads
ProxyPassReverse /uploads http://127.0.0.1:5001/uploads

3. git pull && cp deploy/apache/site_dist.htaccess site_dist/.htaccess && pm2 restart thangtinhoc-api

## URL muc tieu SAI (anh cua ban)

- SAI: http://127.0.0.1:5001/api + Proxy dir /api
- DUNG: http://127.0.0.1:5001 (khong /api o cuoi)
