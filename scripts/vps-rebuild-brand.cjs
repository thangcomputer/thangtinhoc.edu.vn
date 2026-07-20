const { Client } = require('ssh2');
const password = process.env.VPS_PASS;
const root = '/www/wwwroot/thangtinhoc';

const remoteScript = `#!/bin/bash
set -e
cd "${root}"
echo "=== Patch brand + domain thangtinhoc.edu.vn on VPS ==="
sed -i 's/Tin học 24h/Thắng Tin Học/g' client/index.html admin/index.html admin/public/index.html 2>/dev/null || true
sed -i 's/Tin học 24h/Thắng Tin Học/g' client/src/components/*.jsx client/src/pages/*.jsx admin/src/pages/*.jsx 2>/dev/null || true
sed -i 's|https://tinhoc24h.giasutinhoc24h.com|https://thangtinhoc.edu.vn|g' client/index.html admin/src/lib/siteUrl.js client/public/robots.txt 2>/dev/null || true
sed -i 's/contact@tinhoc24h.giasutinhoc24h.com/contact@thangtinhoc.edu.vn/g' client/src/components/Footer.jsx client/src/pages/Contact.jsx admin/src/pages/Settings.jsx 2>/dev/null || true
sed -i "s/sites: '[^']*'/sites: 'thangtinhoc.edu.vn'/g" server/lib/copywriterPrompt.js 2>/dev/null || true
grep -n "logo-name" admin/src/components/Sidebar.jsx || true
echo
echo "=== Rebuild frontend ==="
bash deploy/rebuild-frontend.sh 2>&1 | tail -20
echo
echo "=== Verify settings API ==="
curl -s "https://thangtinhoc.edu.vn/api/settings" | grep -o '"site_name":"[^"]*"'
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
