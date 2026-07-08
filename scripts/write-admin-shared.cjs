const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "admin", "src");
function w(rel, content) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}