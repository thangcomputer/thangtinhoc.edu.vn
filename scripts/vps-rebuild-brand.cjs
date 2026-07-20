const { Client } = require('ssh2');
const password = process.env.VPS_PASS;
const root = '/www/wwwroot/tinhoc24h.giasutinhoc24h.com';

const remoteScript = `#!/bin/bash
set -e
cd "${root}"
echo "=== Patch brand names on VPS source ==="
sed -i 's/Thắng Admin/Tin học 24h/g' admin/src/components/Sidebar.jsx 2>/dev/null || true
sed -i 's/Thắng Tin Học/Tin học 24h/g' server/.env.example 2>/dev/null || true
sed -i "s/Thắng Computer/Tin học 24h/g" server/lib/copywriterPrompt.js 2>/dev/null || true
sed -i "s/thangcomputer.com & giasutinhoc24h.com/tinhoc24h.giasutinhoc24h.com/g" server/lib/copywriterPrompt.js 2>/dev/null || true
sed -i 's|https://thangtinhoc.edu.vn|https://tinhoc24h.giasutinhoc24h.com|g' admin/src/lib/siteUrl.js 2>/dev/null || true
sed -i 's/info@thangtinhoc.vn/contact@tinhoc24h.giasutinhoc24h.com/g' client/src/components/Footer.jsx client/src/pages/Contact.jsx 2>/dev/null || true
sed -i 's/contact@thangtinhoc.vn/contact@tinhoc24h.giasutinhoc24h.com/g' admin/src/pages/Settings.jsx 2>/dev/null || true
grep -n "logo-name" admin/src/components/Sidebar.jsx || true
echo
echo "=== Rebuild frontend ==="
bash deploy/rebuild-frontend.sh 2>&1 | tail -20
echo
echo "=== Verify settings API ==="
curl -s "https://tinhoc24h.giasutinhoc24h.com/api/settings" | grep -o '"site_name":"[^"]*"'
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
.connect({ host: '103.124.92.238', port: 22, username: 'root', password, readyTimeout: 300000 });
