const { Client } = require('ssh2');

const password = process.env.VPS_PASS;
const domain = 'thangtinhoc.edu.vn';

const remoteScript = `#!/bin/bash
set -e
echo "=== PM2 ==="
pm2 list || true
echo
echo "=== Ports ==="
ss -tlnp | grep -E ':500[0-9]' || netstat -tlnp 2>/dev/null | grep -E ':500[0-9]' || true
echo
echo "=== Health ports ==="
for p in 5000 5001 5002 5003; do
  code=$(curl -s -o /tmp/h.json -w "%{http_code}" "http://127.0.0.1:$p/api/health" 2>/dev/null || echo ERR)
  echo "port $p -> $code $(head -c 80 /tmp/h.json 2>/dev/null)"
done
echo
echo "=== Apache vhosts for domain ==="
ls -la /www/server/panel/vhost/apache/ | grep tinhoc || true
grep -l "${domain}" /www/server/panel/vhost/apache/*.conf 2>/dev/null || true
echo
for f in /www/server/panel/vhost/apache/thangtinhoc.edu.vn.conf /www/server/panel/vhost/apache/thangtinhoc.edu.vn.conf.bak.*; do
  [ -f "$f" ] || continue
  echo "--- $f ---"
  grep -E 'ServerName|ProxyPass|VirtualHost' "$f" | head -20 || true
done
echo
echo "=== Domain health now ==="
curl -s "https://${domain}/api/health" | head -c 200
echo
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(remoteScript, (err, stream) => {
    if (err) { console.error(err); process.exit(1); }
    stream.on('close', (c) => { conn.end(); process.exit(c || 0); });
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
  });
}).on('error', (e) => { console.error('SSH error:', e.message); process.exit(1); })
.connect({ host: '103.124.92.238', port: 22, username: 'root', password, readyTimeout: 25000 });
