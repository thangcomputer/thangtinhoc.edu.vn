const { Client } = require('ssh2');

const password = process.env.VPS_PASS;
const root = '/www/wwwroot/thangtinhoc';

const remoteScript = `#!/bin/bash
set -e
cd "${root}/server"
echo "=== Resolve failed migration ==="
npx prisma migrate resolve --applied 20260522100000_add_contact_subject 2>&1 || true
echo
echo "=== Continue migrate ==="
npx prisma migrate deploy 2>&1 || true
echo
echo "=== Check UserSession table ==="
sqlite3 prisma/dev.db ".tables" | tr ' ' '\\n' | grep -i session || true
echo
pm2 restart thangtinhoc-api
sleep 3
echo "=== Login test ==="
curl -s -o /tmp/login.json -w "HTTP %{http_code}\\n" -X POST "https://thangtinhoc.edu.vn/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@gmail.com","password":"user123","deviceId":"0123456789abcdef"}'
cat /tmp/login.json | head -c 400
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
.connect({ host: '103.124.92.238', port: 22, username: 'root', password, readyTimeout: 60000 });
