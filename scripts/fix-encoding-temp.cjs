/**
 * Sua file bi UTF-16 ve UTF-8 (Windows).
 * node scripts/fix-encoding.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  'admin/src/lib/deviceId.js',
  'admin/src/lib/useIdleLogout.js',
  'admin/src/lib/useSecurityProtection.js',
  'admin/src/lib/logout.js',
  'client/src/lib/deviceId.js',
  'client/src/lib/useIdleLogout.js',
  'client/src/lib/useSecurityProtection.js',
  'client/src/lib/logout.js',
  'server/lib/session.js',
  'server/lib/authSession.js',
  'scripts/merge-site-dist.cjs',
  'package.json',
];

function readAsUtf8(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString('utf16le');
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return buf.toString('utf16le');
  }
  if (buf.length >= 4 && buf[1] === 0 && buf[3] === 0) {
    return buf.toString('utf16le');
  }
  return buf.toString('utf8').replace(/^\uFEFF/, '');
}

let fixed = 0;
for (const rel of targets) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  const buf = fs.readFileSync(p);
  const isUtf16 = buf.length >= 4 && buf[0] === 0x63 && buf[1] === 0 && buf[2] === 0x6f && buf[3] === 0;
  if (!isUtf16 && !(buf[0] === 0xff && buf[1] === 0xfe)) continue;
  const text = readAsUtf8(p);
  fs.writeFileSync(p, text, 'utf8');
  console.log('Fixed:', rel);
  fixed += 1;
}
console.log(fixed ? `Done. ${fixed} file(s).` : 'No UTF-16 files found.');
