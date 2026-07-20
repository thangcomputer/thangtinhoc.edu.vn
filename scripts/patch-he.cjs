const fs = require("fs");
const file = "c:/Users/thang/Desktop/WEB/admin/src/pages/HomeEditor.jsx";
let c = fs.readFileSync(file, "utf8");
const shell = [
  "      <div className=\"home-editor-shell\">",
  "        <HomeEditorNav",
  "          groups={TAB_GROUPS}",
  "          tabById={TAB_BY_ID}",
  "          activeTab={activeTab}",
  "          onSelect={setActiveTab}",
  "          onVisual={() => setViewMode('visual')}",
  "        />",
  "        <div className=\"home-editor-main\">",
  "          {activeTabData && (",
  "            <header className=\"home-editor-section-head\">",
  "              <div>",
  "                <h2 className=\"home-editor-section-title\">",
  "                  <activeTabData.icon size={20} />",
  "                  {activeTabData.label}",
  "                </h2>",
  "                <p className=\"home-editor-section-desc\">{activeTabData.desc}</p>",
  "              </div>",
  "              <a href=\"/\" target=\"_blank\" rel=\"noopener noreferrer\" className=\"btn btn-outline btn-sm\">",
  "                <Eye size={14} /> Xem trang chu",
  "              </a>",
  "            </header>",
  "          )}",
  "          <motion.div className=\"home-editor-content\">",
].join("\n").replace(/motion\.div/g, "div");
const re = /      \{\/\* Tabs \*\/\}[\s\S]*?      \{\/\* Tab Content \*\/\}\r?\n      <div style=\{\{ paddingBottom: '4rem' \}\}>/;
console.log("match", re.test(c));
c = c.replace(re, shell);
const endRe = /(\r?\n        \}\)\}\r?\n      <\/motion.div>\r?\n      <\/>\)\}\r?\n\r?\n      \{\/\* Floating Save Bar \*\/\})/;
if (!endRe.test(c)) {
  const endRe2 = /(\r?\n        \}\)\}\r?\n      <\/div>\r?\n      <\/>\)\}\r?\n\r?\n      \{\/\* Floating Save Bar \*\/\})/;
  console.log("end2", endRe2.test(c));
  c = c.replace(endRe2, "\n        })}\n          </div>\n        </div>\n      </div>\n      </>)}\n\n      {/* Floating Save Bar */}");
} else {
  c = c.replace(endRe, "\n        })}\n          </div>\n        </div>\n      </div>\n      </>)}\n\n      {/* Floating Save Bar */}");
}
fs.writeFileSync(file, c);
console.log("shell", c.includes("home-editor-shell"));