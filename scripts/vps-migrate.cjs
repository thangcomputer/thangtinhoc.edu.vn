const { Client } = require('ssh2');

const password = process.env.VPS_PASS;
const root = '/www/wwwroot/thangtinhoc';

const remoteScript = `#!/bin/bash
set -e
cd "${root}"
echo "=== Git status ==="
git log -1 --oneline || true
echo
echo "=== Prisma migrate ==="
cd server
npm ci --omit=dev 2>&1 | tail -3 || npm install --omit=dev 2>&1 | tail -3
npx prisma migrate deploy 2>&1
echo
echo "=== Restart PM2 tinhoc24h ==="
pm2 restart tinhoc24h
sleep 3
echo
echo "=== Login test ==="
curl -s -o /tmp/login.json -w "HTTP %{http_code}\\n" -X POST "https://thangtinhoc.edu.vn/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@gmail.com","password":"user123","deviceId":"0123456789abcdef"}'
head -c 300 /tmp/login.json
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
