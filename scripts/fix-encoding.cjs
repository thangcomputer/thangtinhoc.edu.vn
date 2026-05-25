const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'site_dist', 'uploads', '.cursor',
  'coverage', '.next', 'build',
]);
const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2',
  '.ttf', '.eot', '.zip', '.db', '.sqlite', '.pdf', '.mp4', '.webm', '.lock',
]);
const TEXT_EXT = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html', '.md', '.sql',
  '.cjs', '.mjs', '.sh', '.conf', '.svg', '.yml', '.yaml', '.prisma', '.txt',
]);

function isUtf16(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return true;
  if (buf.length >= 4 && buf[1] === 0 && buf[3] === 0) return true;
  if (buf.length >= 4 && buf[0] === 0x63 && buf[1] === 0 && buf[2] === 0x6f && buf[3] === 0) return true;
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

function readText(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString('utf16le');
  if (buf.length >= 4 && buf[1] === 0 && buf[3] === 0) return buf.toString('utf16le');
  return buf.toString('utf16le');
}

function shouldScan(name) {
  const ext = path.extname(name).toLowerCase();
  if (SKIP_EXT.has(ext)) return false;
  if (TEXT_EXT.has(ext)) return true;
  return ['.env', '.gitignore', '.gitattributes', '.editorconfig'].includes(name)
    || name.endsWith('.env.example');
}

function walk(dir, converted) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === '.' || ent.name === '..') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(full, converted);
      continue;
    }
    if (!shouldScan(ent.name)) continue;
    const buf = fs.readFileSync(full);
    if (!isUtf16(buf)) continue;
    fs.writeFileSync(full, readText(buf), 'utf8');
    converted.push(path.relative(ROOT, full).split(path.sep).join('/'));
  }
}

const converted = [];
walk(ROOT, converted);
if (converted.length === 0) {
  console.log('OK: all text files are UTF-8');
} else {
  console.log('Converted', converted.length, 'file(s) to UTF-8:');
  converted.forEach((f) => console.log('  -', f));
}