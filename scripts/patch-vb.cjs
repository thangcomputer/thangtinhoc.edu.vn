const fs = require("fs");
const f = "c:/Users/thang/Desktop/WEB/admin/src/components/VisualBuilder.jsx";
let c = fs.readFileSync(f, "utf8");
const btn = `            <button
              type="button"
              onClick={() => setLiveSitePreview((v) => !v)}
              style={{ background: liveSitePreview ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Xem trang chủ thật (sau khi lưu)"
            >
              {liveSitePreview ? <PanelRightClose size={10} /> : <PanelRightOpen size={10} />}
              Trang thật
            </button>
`;
if (!c.includes("setLiveSitePreview")) console.log("missing state");
if (!c.includes("Trang thật")) {
  c = c.replace(
    /            <button onClick=\{resetAll\}/,
    btn + "            <button onClick={resetAll}"
  );
}
const panel = `
      {liveSitePreview && (
        <div className="home-editor-visual-live-preview">
          <HomeEditorPreview activeTab={livePreviewTab} refreshKey={previewRefreshKey} />
        </div>
      )}
`;
if (!c.includes("home-editor-visual-live-preview")) {
  c = c.replace(
    /      \{\!showStructure && \(/,
    panel + "\n      {!showStructure && ("
  );
}
fs.writeFileSync(f, c);
console.log("vb", c.includes("Trang thật"), c.includes("home-editor-visual-live-preview"));