const { Client } = require('ssh2');
const password = process.env.VPS_PASS;
const root = '/www/wwwroot/thangtinhoc';

const remoteScript = `#!/bin/bash
set -e
ENV_FILE="${root}/server/.env"
echo "=== Before ==="
grep -E 'ALLOW_MOCK|NODE_ENV' "$ENV_FILE" || true
if grep -q '^ALLOW_MOCK_PAYMENT=' "$ENV_FILE"; then
  sed -i 's/^ALLOW_MOCK_PAYMENT=.*/ALLOW_MOCK_PAYMENT=true/' "$ENV_FILE"
else
  echo 'ALLOW_MOCK_PAYMENT=true' >> "$ENV_FILE"
fi
echo "=== After ==="
grep -E 'ALLOW_MOCK|NODE_ENV' "$ENV_FILE"
pm2 restart thangtinhoc-api --update-env
sleep 3
echo "=== Test mock order (need token - check env only) ==="
node -e "require('dotenv').config({path:'${root}/server/.env'}); console.log('ALLOW_MOCK_PAYMENT=', process.env.ALLOW_MOCK_PAYMENT); console.log('NODE_ENV=', process.env.NODE_ENV);"
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
