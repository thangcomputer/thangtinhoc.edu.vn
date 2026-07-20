const { Client } = require('ssh2');
const password = process.env.VPS_PASS;
const root = '/www/wwwroot/tinhoc24h.giasutinhoc24h.com';

const remoteScript = `#!/bin/bash
set -e
cd "${root}/server"
echo "=== Current site_name ==="
sqlite3 prisma/dev.db "SELECT key,value FROM SystemSetting WHERE key IN ('site_name','footer_text','site_description');"
echo
echo "=== Update brand settings ==="
sqlite3 prisma/dev.db "UPDATE SystemSetting SET value='Tin học 24h' WHERE key='site_name';"
sqlite3 prisma/dev.db "UPDATE SystemSetting SET value='© 2026 Tin học 24h' WHERE key='footer_text';"
sqlite3 prisma/dev.db "INSERT OR IGNORE INTO SystemSetting (key,value) VALUES ('site_name','Tin học 24h');"
sqlite3 prisma/dev.db "INSERT OR IGNORE INTO SystemSetting (key,value) VALUES ('footer_text','© 2026 Tin học 24h');"
echo "=== After update ==="
sqlite3 prisma/dev.db "SELECT key,value FROM SystemSetting WHERE key IN ('site_name','footer_text','site_description');"
echo
curl -s "https://tinhoc24h.giasutinhoc24h.com/api/settings" | head -c 300
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
