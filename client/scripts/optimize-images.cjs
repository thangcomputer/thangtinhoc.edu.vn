const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'public');

const RULES = [
  { match: /courses[\\/]/i, width: 640, quality: 74 },
  { match: /^hero/i, width: 900, quality: 72 },
  { match: /icon_3d|computer_usage/i, width: 320, quality: 75 },
  { match: /^logo_/i, width: 280, quality: 78 },
  { match: /^logo\.png$/i, width: 400, quality: 80 },
  { match: /promo_popup|partner_logos/i, width: 800, quality: 72 },
  { match: /\.png$/i, width: 800, quality: 75 },
];

function ruleFor(rel) {
  return RULES.find((r) => r.match.test(rel)) || RULES[RULES.length - 1];
}

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (name.toLowerCase().endsWith('.png')) list.push(full);
  }
  return list;
}

async function convert(full) {
  const rel = path.relative(ROOT, full);
  const rule = ruleFor(rel);
  const dest = full.replace(/\.png$/i, '.webp');
  const before = fs.statSync(full).size;
  await sharp(full)
    .resize({ width: rule.width, withoutEnlargement: true })
    .webp({ quality: rule.quality })
    .toFile(dest);
  const after = fs.statSync(dest).size;
  console.log(`${rel} → ${path.basename(dest)}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`);
}

(async () => {
  for (const f of walk(ROOT)) {
    try {
      await convert(f);
    } catch (e) {
      console.error('FAIL', f, e.message);
    }
  }
})();
