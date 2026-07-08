/**
 * Quét repo và chuyển file text UTF-16 (LE/BE) sang UTF-8 (không BOM).
 * Chạy: node scripts/convert-to-utf8.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'site_dist', 'uploads', '.cursor',
  'coverage', '.next', 'build',
]);
const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2',
  '.ttf', '.eot', '.zip', '.db', '.sqlite', '.pdf', '.mp4', '.webm',
  '.lock',
]);
const TEXT_EXT = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html', '.md', '.sql',
  '.cjs', '.mjs', '.sh', '.conf', '.svg', '.yml', '.yaml', '.prisma', '.txt',
  '.env', '.example', '.gitignore', '.gitattributes', '.editorconfig',
]);

function isUtf16(buf) {
  if (buf.length < 2) return false;
  if ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff)) {
    return true;
  }
  if (buf.length < 4 || buf.length % 2 !== 0) return false;
  let nulls = 0;
  let ascii = 0;
  const sample = Math.min(buf.length, 800);
  for (let i = 0; i < sample; i += 2) {
    if (buf[i + 1] === 0 && buf[i] >= 0x20 && buf[i] < 127) {
      nulls++;
      ascii++;
    }
  }
  return ascii > 20 && nulls / ascii > 0.9;
}

function decodeUtf16(buf) {
  const le = buf[0] === 0xff && buf[1] === 0xfe;
  const be = buf[0] === 0xfe && buf[1] === 0xff;
  let start = le || be ? 2 : 0;
  let out = '';
  for (let i = start; i + 1 < buf.length; i += 2) {
    const code = le ? buf[i] | (buf[i + 1] << 8) : (buf[i] << 8) | buf[i + 1];
    if (code === 0 && i > start + 4) break;
    out += String.fromCharCode(code);
  }
  return out.replace(/\u0000/g, '');
}

function shouldScan(filePath, name) {
  const ext = path.extname(name).toLowerCase();
  if (SKIP_EXT.has(ext)) return false;
  if (TEXT_EXT.has(ext)) return true;
  if (name === '.env' || name.endsWith('.env.example')) return true;
  if (name === '.gitignore' || name === '.gitattributes' || name === '.editorconfig') return true;
  return false;
}

function walk(dir, converted, scanned) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === '.' || ent.name === '..') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(full, converted, scanned);
      continue;
    }
    if (!shouldScan(full, ent.name)) continue;
    scanned.push(full);
    const buf = fs.readFileSync(full);
    if (!isUtf16(buf)) continue;
    const text = decodeUtf16(buf);
    fs.writeFileSync(full, text, { encoding: 'utf8' });
    converted.push(path.relative(ROOT, full));
  }
}

const converted = [];
const scanned = [];
walk(ROOT, converted, scanned);

console.log(`Scanned ${scanned.length} text files.`);
if (converted.length === 0) {
  console.log('All files already UTF-8 (no UTF-16 found).');
} else {
  console.log(`Converted ${converted.length} file(s) to UTF-8:`);
  converted.forEach((f) => console.log('  -', f));
}
