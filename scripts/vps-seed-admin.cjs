const { Client } = require('ssh2');
const password = process.env.VPS_PASS;
const root = '/www/wwwroot/thangtinhoc';

const remoteScript = `#!/bin/bash
set -e
cd "${root}/server"
echo "=== Users in DB ==="
sqlite3 prisma/dev.db "SELECT id,email,role,isActive FROM User;" 2>/dev/null || echo "sqlite query failed"
echo
echo "=== Run seed (creates admin@gmail.com) ==="
npm run db:seed 2>&1 | tail -15
echo
echo "=== Admin login test ==="
curl -s -o /tmp/admin.json -w "HTTP %{http_code}\\n" -X POST "https://thangtinhoc.edu.vn/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@gmail.com","password":"admin123","deviceId":"0123456789abcdef"}'
head -c 350 /tmp/admin.json
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
