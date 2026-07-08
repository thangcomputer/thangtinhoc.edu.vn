const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "admin", "src", "pages", "HomeEditor.jsx");
let c = fs.readFileSync(file, "utf8");
const newAnim = "const AnimPicker = ({ settingKey, label, settings, updateSetting }) => (\n  <details className=\"home-editor-advanced\">\n    <summary>\n      <Palette size={15} />\n      <span>Hi\u1ec7u \u1ee9ng cu\u1ed9n \u2014 {label}</span>\n      <span className=\"home-editor-advanced-value\">\n        {ANIMATION_OPTIONS.find((o) => o.value === (settings[settingKey] || 'fade-up'))?.label || 'Fade Up'}\n      </span>\n    </summary>\n    <select className=\"form-control\" value={settings[settingKey] || 'fade-up'} onChange={(e) => updateSetting(settingKey, e.target.value)}>\n      {ANIMATION_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}\n    </select>\n  </details>\n);\n\n";
c = c.replace(/const AnimPicker = \(\{ settingKey, label, settings, updateSetting \}\) => \([\s\S]*?\n\);\n\nexport default/, newAnim + "export default");
const shell = "      <motion.div className=\"home-editor-shell\">";