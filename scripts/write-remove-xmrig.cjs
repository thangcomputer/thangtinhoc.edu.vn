const fs = require("fs");
const path = require("path");
const script = `#!/bin/bash
# Go XMRig miner — chay tren VPS (root)
set -euo pipefail

echo "==> 1. Dung process..."
pkill -9 xmrig 2>/dev/null || true
pkill -9 -f '.xmrig' 2>/dev/null || true
pkill -9 -f 'patch[0-9]*.js' 2>/dev/null || true
sleep 1
pgrep -af xmrig || echo "OK: khong con xmrig"

echo "==> 2. Xoa file /root..."
rm -rf /root/.xmrig
rm -f /root/patch.js /root/patch2.js /root/patch3.js
rm -f /root/libssl1.1_1.1.1f-1ubuntu2_amd64.deb 2>/dev/null || true

echo "==> 3. Cron..."
if crontab -l 2>/dev/null | grep -qiE 'xmrig|patch'; then
  crontab -l | grep -viE 'xmrig|patch' | crontab -
fi

echo "==> 4. Tim them..."
find /tmp /var/tmp /dev/shm -maxdepth 4 -iname '*xmrig*' 2>/dev/null -exec rm -rf {} +

echo "XONG. Doi mat khau: passwd"
`;
const out = path.join(__dirname, "..", "deploy", "remove-xmrig-malware.sh");
fs.writeFileSync(out, script, "utf8");
console.log("Wrote", out);
