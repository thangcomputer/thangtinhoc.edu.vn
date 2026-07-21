/**
 * Pull code mới + seed 2 bài MOS/IC3 trên VPS.
 * Chạy local: VPS_PASS=... node scripts/vps-seed-mos-ic3-posts.cjs
 */
const { Client } = require('ssh2');

const password = process.env.VPS_PASS;
const root = '/www/wwwroot/thangtinhoc';

if (!password) {
  console.error('Missing VPS_PASS env');
  process.exit(1);
}

const remoteScript = `#!/bin/bash
set -e
cd "${root}"
echo "=== Git pull ==="
git fetch origin main
git pull origin main
echo
echo "=== Rebuild frontend (blog images in client/public/blog) ==="
bash deploy/rebuild-frontend.sh 2>&1 | tail -25
echo
echo "=== Seed MOS/IC3 posts ==="
cd "${root}/server"
node scripts/seed-mos-ic3-posts.cjs
echo
echo "=== Verify posts API ==="
curl -s "https://thangtinhoc.edu.vn/api/posts?limit=20" | grep -o '"slug":"cau-truc-de-thi-[^"]*"' || true
echo
curl -s -o /tmp/mos-post.json -w "MOS HTTP %{http_code}\\n" "https://thangtinhoc.edu.vn/api/posts/cau-truc-de-thi-mos"
curl -s -o /tmp/ic3-post.json -w "IC3 HTTP %{http_code}\\n" "https://thangtinhoc.edu.vn/api/posts/cau-truc-de-thi-ic3"
head -c 120 /tmp/mos-post.json
echo
head -c 120 /tmp/ic3-post.json
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
      stream.on('close', (c) => {
        conn.end();
        process.exit(c || 0);
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
    host: process.env.VPS_HOST || '103.124.92.238',
    port: Number(process.env.VPS_PORT || 22),
    username: process.env.VPS_USER || 'root',
    password,
    readyTimeout: 300000,
  });
