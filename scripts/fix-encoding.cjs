const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const targets = [
  "admin/src/lib/deviceId.js","admin/src/lib/useIdleLogout.js","admin/src/lib/useSecurityProtection.js","admin/src/lib/logout.js",
  "client/src/lib/deviceId.js","client/src/lib/useIdleLogout.js","client/src/lib/useSecurityProtection.js","client/src/lib/logout.js",
  "client/src/components/CookieConsent.css",
  "server/lib/session.js","server/lib/authSession.js","scripts/merge-site-dist.cjs","package.json"
];
function walkCss(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory() && name !== "node_modules" && name !== "dist") walkCss(p, out);
    else if (name.endsWith(".css")) out.push(p);
  }
}
const cssDirs = ["client/src", "admin/src"];
const extraCss = [];
for (const d of cssDirs) walkCss(path.join(root, d), extraCss);
function readText(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString("utf16le");
  if (buf.length >= 4 && buf[1] === 0 && buf[3] === 0) return buf.toString("utf16le");
  return buf.toString("utf8").replace(/^\uFEFF/, "");
}
function isUtf16(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return true;
  if (buf.length >= 4 && buf[1] === 0 && buf[3] === 0) return true;
  if (buf.length >= 4 && buf[0] === 0x63 && buf[1] === 0 && buf[2] === 0x6f && buf[3] === 0) return true;
  return false;
}
function fixFile(p, label) {
  const buf = fs.readFileSync(p);
  if (!isUtf16(buf)) return false;
  fs.writeFileSync(p, readText(buf), "utf8");
  console.log("Fixed:", label);
  return true;
}
let n = 0;
for (const rel of targets) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  if (fixFile(p, rel)) n++;
}
for (const p of extraCss) {
  const rel = path.relative(root, p).split(path.sep).join("/");
  if (targets.includes(rel)) continue;
  if (fixFile(p, rel)) n++;
}
console.log(n ? "Done " + n + " files" : "No UTF-16 found");