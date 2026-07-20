const { Client } = require('ssh2');

const host = process.env.VPS_HOST || '103.124.92.238';
const password = process.env.VPS_PASS;
const domain = process.env.VPS_DOMAIN || 'thangtinhoc.edu.vn';
const port = process.env.VPS_API_PORT || '5002';

if (!password) {
  console.error('Missing VPS_PASS env');
  process.exit(1);
}

const remoteScript = `#!/bin/bash
set -e
DOMAIN=${domain}
PORT=${port}
echo "=== Backend local ==="
curl -s "http://127.0.0.1:\${PORT}/api/health" || true
echo
echo "=== Find vhost ==="
VHOST=$(grep -rl "\${DOMAIN}" /www/server/panel/vhost/apache/ 2>/dev/null | head -1)
echo "VHOST=\${VHOST}"
if [ -z "\${VHOST}" ]; then echo NO_VHOST; exit 2; fi
echo "=== Current ProxyPass ==="
grep -E 'ProxyPass|ProxyPassReverse' "\${VHOST}" || echo NONE
if ! grep -q 'ProxyPass.*/api' "\${VHOST}"; then
  cp "\${VHOST}" "\${VHOST}.bak.$(date +%s)"
  awk -v p="\${PORT}" '
    /<\\/VirtualHost>/ && !done {
      print "<IfModule mod_proxy.c>"
      print "  ProxyPreserveHost On"
      print "  ProxyPass /api http://127.0.0.1:" p "/api"
      print "  ProxyPassReverse /api http://127.0.0.1:" p "/api"
      print "  ProxyPass /uploads http://127.0.0.1:" p "/uploads"
      print "  ProxyPassReverse /uploads http://127.0.0.1:" p "/uploads"
      print "</IfModule>"
      done=1
    }
    { print }
  ' "\${VHOST}" > "\${VHOST}.tmp" && mv "\${VHOST}.tmp" "\${VHOST}"
  echo ADDED_PROXY
else
  echo PROXY_EXISTS
fi
/etc/init.d/httpd reload 2>&1 || systemctl reload httpd 2>&1 || apachectl graceful 2>&1
sleep 2
echo "=== Domain health ==="
curl -s "https://\${DOMAIN}/api/health" | head -c 300
echo
echo "=== Login test status ==="
curl -s -o /dev/null -w "%{http_code}" -X POST "https://\${DOMAIN}/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@gmail.com","password":"user123","deviceId":"0123456789abcdef"}'
echo
`;

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(remoteScript, (err, stream) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      stream.on('close', (code) => {
        conn.end();
        process.exit(code || 0);
      });
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({
    host,
    port: 22,
    username: 'root',
    password,
    readyTimeout: 25000,
  });
