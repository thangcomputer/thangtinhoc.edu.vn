const { Client } = require('ssh2');

const password = process.env.VPS_PASS;
const domain = 'thangtinhoc.edu.vn';
const conf = '/www/server/panel/vhost/apache/thangtinhoc.edu.vn.conf';
const port = '5001';

const remoteScript = `#!/bin/bash
set -e
echo "=== Fix proxy port ${port} in ${conf} ==="
cp "${conf}" "${conf}.bak.fixport"
sed -i 's|127.0.0.1:5002|127.0.0.1:${port}|g' "${conf}"
grep -E 'ProxyPass|ServerName|ServerAlias' "${conf}" | head -20
echo
echo "=== Test backend :${port} ==="
curl -s "http://127.0.0.1:${port}/api/health"
echo
/etc/init.d/httpd reload 2>&1 || systemctl reload httpd 2>&1
sleep 2
echo "=== Domain health ==="
curl -s "https://${domain}/api/health"
echo
echo
echo "=== Login HTTP code ==="
curl -s -o /tmp/login.json -w "%{http_code}" -X POST "https://${domain}/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@gmail.com","password":"user123","deviceId":"0123456789abcdef"}'
echo
head -c 200 /tmp/login.json
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
