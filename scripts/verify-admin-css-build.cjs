const fs = require("fs");
const path = require("path");
const assetsDir = path.join(__dirname, "..", "admin", "dist", "assets");
if (!fs.existsSync(assetsDir)) {
  console.error("LOI: chua co admin/dist");
  process.exit(1);
}
const cssFile = fs.readdirSync(assetsDir).find((f) => f.startsWith("index-") && f.endsWith(".css"));
const css = fs.readFileSync(path.join(assetsDir, cssFile), "utf8");
const hasCard = css.includes("max-width:1024px") && css.includes(".table-wrap") && css.includes("thead{display:none}");
const hasMax = /@media\s*\(\s*max-width:/.test(css);
console.log(hasCard ? "OK" : "FAIL", "table card @ 1024px");
console.log(hasMax ? "OK" : "FAIL", "max-width media queries");
console.log("File:", cssFile);
process.exit(hasCard && hasMax ? 0 : 1);