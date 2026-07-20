const fs = require("fs");
const file = "c:/Users/thang/Desktop/WEB/admin/src/pages/HomeEditor.jsx";
let c = fs.readFileSync(file, "utf8");
const newAnim = `const AnimPicker = ({ settingKey, label, settings, updateSetting }) => (
  <details className="home-editor-advanced">
    <summary>
      <Palette size={15} />
      <span>Hi\u1ec7u \u1ee9ng cu\u1ed9n \u2014 {label}</span>
      <span className="home-editor-advanced-value">
        {ANIMATION_OPTIONS.find((o) => o.value === (settings[settingKey] || 'fade-up'))?.label || 'Fade Up'}
      </span>
    </summary>
    <select className="form-control" value={settings[settingKey] || 'fade-up'} onChange={(e) => updateSetting(settingKey, e.target.value)}>
      {ANIMATION_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
    </select>
  </details>
);

`;
c = c.replace(/const AnimPicker = \(\{ settingKey, label, settings, updateSetting \}\) => \([\s\S]*?\n\);\r?\n\r?\nexport default/, newAnim + "export default");
fs.writeFileSync(file, c);
console.log("anim", c.includes("home-editor-advanced"));