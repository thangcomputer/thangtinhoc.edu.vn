const { Client } = require('ssh2');
const password = process.env.VPS_PASS;
const root = '/www/wwwroot/thangtinhoc';
const envFile = `${root}/server/.env`;

const remoteScript = `#!/bin/bash
set -e
# Fix malformed line (MAX_FILE_SIZE...ALLOW_MOCK_PAYMENT glued)
sed -i 's/MAX_FILE_SIZE=104857600ALLOW_MOCK_PAYMENT=true/MAX_FILE_SIZE=104857600\\nALLOW_MOCK_PAYMENT=true/' "${envFile}"
grep -v '^ALLOW_MOCK_PAYMENT=' "${envFile}" > "${envFile}.tmp"
echo 'ALLOW_MOCK_PAYMENT=true' >> "${envFile}.tmp"
mv "${envFile}.tmp" "${envFile}"
echo "=== Fixed .env ==="
grep -E 'MAX_FILE_SIZE|ALLOW_MOCK|NODE_ENV' "${envFile}"
pm2 restart tinhoc24h --update-env
sleep 2
cd "${root}/server"
node -e "require('dotenv').config(); const {isMockPaymentAllowed}=require('./lib/validate'); console.log('isMockPaymentAllowed:', isMockPaymentAllowed());"
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
