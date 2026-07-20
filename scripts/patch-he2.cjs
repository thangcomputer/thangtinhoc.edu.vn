const fs = require("fs");
const file = "c:/Users/thang/Desktop/WEB/admin/src/pages/HomeEditor.jsx";
let c = fs.readFileSync(file, "utf8");

if (!c.includes("HomeEditorSectionHead")) {
  c = c.replace(
    "import HomeEditorNav from '../components/HomeEditorNav';",
    `import HomeEditorNav from '../components/HomeEditorNav';
import HomeEditorSectionHead from '../components/HomeEditorSectionHead';
import HomeEditorPreview from '../components/HomeEditorPreview';
import { buildSectionSettings, getSectionMeta } from '../lib/homeEditorSections';`
  );
}

if (!c.includes("showPreview")) {
  c = c.replace(
    "const [viewMode, setViewMode] = useState('visual');",
    `const [viewMode, setViewMode] = useState('visual');
  const [showPreview, setShowPreview] = useState(true);
  const [savingSection, setSavingSection] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);`
  );
}

if (!c.includes("handleSaveSection")) {
  const insertAfter = `  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...settings,
        home_features: JSON.stringify(features),
        home_testimonials: JSON.stringify(testimonials),
        home_stats: JSON.stringify(stats),
        home_partners: JSON.stringify(partners),
        home_learning_path: JSON.stringify(learningPath),
        home_visual_features: JSON.stringify(visualFeatures),
        footer_columns: JSON.stringify(footerColumns),
        section_order: JSON.stringify(sectionOrder),
        section_visibility: JSON.stringify(sectionVisibility),
        custom_sections: JSON.stringify(customSections),
      };
      await api.post('/settings/bulk', { settings: dataToSave });
      toast.success('\u2705 \u0110\u00e3 l\u01b0u thay \u0111\u1ed5i giao di\u1ec7n th\u00e0nh c\u00f4ng!');
      setHasChanges(false);
    } catch {
      toast.error('L\u1ed7i khi l\u01b0u c\u1ea5u h\u00ecnh');
    } finally {
      setSaving(false);
    }
  };`;

  const sectionSave = `
  const editorCtx = () => ({
    settings, features, testimonials, stats, partners, learningPath, visualFeatures, footerColumns,
    sectionOrder, sectionVisibility, customSections,
  });

  const handleSaveSection = async () => {
    setSavingSection(true);
    try {
      const partial = buildSectionSettings(activeTab, editorCtx());
      await api.post('/settings/bulk', { settings: partial });
      toast.success('\u0110\u00e3 l\u01b0u ph\u1ea7n: ' + (TAB_BY_ID[activeTab]?.label || activeTab));
      setPreviewTick((t) => t + 1);
    } catch {
      toast.error('L\u1ed7i khi l\u01b0u ph\u1ea7n n\u00e0y');
    } finally {
      setSavingSection(false);
    }
  };

  const getSectionAdd = () => {
    switch (activeTab) {
      case 'stats': return () => statH.add({ value: '1,000+', label: 'Nh\u00e3n m\u1edbi', icon: 'Users' });
      case 'features': return () => featureH.add({ title: 'T\u00ednh n\u0103ng m\u1edbi', desc: 'M\u00f4 t\u1ea3 chi ti\u1ebft', icon: 'Zap' });
      case 'learning-path': return () => pathH.add({ step: String(learningPath.length + 1).padStart(2, '0'), title: 'B\u01b0\u1edbc m\u1edbi', desc: 'M\u00f4 t\u1ea3 b\u01b0\u1edbc', icon: 'Target' });
      case 'visual-learning': return () => visualH.add({ emoji: '\uD83D\uDCC1', title: 'T\u00ednh n\u0103ng m\u1edbi', desc: 'M\u00f4 t\u1ea3' });
      case 'testimonials': return () => testimonialH.add({ name: 'H\u1ecd t\u00ean', role: 'Vai tr\u00f2', text: 'N\u1ed9i dung c\u1ea3m nh\u1eadn', rating: 5, avatar: '' });
      case 'partners': return () => partnerH.add({ name: 'C\u00f4ng ty m\u1edbi', logo: '' });
      case 'footer': return addFooterCol;
      default: return null;
    }
  };
`;

  c = c.replace(insertAfter, insertAfter + sectionSave);
}

const oldHead = `          {activeTabData && (
            <header className="home-editor-section-head">
              <div>
                <h2 className="home-editor-section-title">
                  <activeTabData.icon size={20} />
                  {activeTabData.label}
                </h2>
                <p className="home-editor-section-desc">{activeTabData.desc}</p>
              </div>
              <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                <Eye size={14} /> Xem trang chu
              </a>
            </header>
          )}
          <div className="home-editor-content">`;

const newHead = `          <HomeEditorSectionHead
            tab={activeTabData}
            {...(getSectionMeta(activeTab, editorCtx()) || {})}
            onAdd={getSectionAdd()}
            addLabel={getSectionMeta(activeTab, editorCtx())?.addLabel}
            onSaveSection={handleSaveSection}
            savingSection={savingSection}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview((v) => !v)}
          />
          <div className={\`home-editor-split\${showPreview ? ' has-preview' : ''}\`}>
          <div className="home-editor-content">`;

if (c.includes(oldHead)) c = c.replace(oldHead, newHead);
else console.warn("head block missing");

const closeOld = `          </motion.div>
        </motion.div>
      </motion.div>
      </>)}`;
const closeNew = `          </div>
          {showPreview ? <HomeEditorPreview activeTab={activeTab} refreshKey={previewTick} /> : null}
          </div>
        </div>
      </div>
      </>)}`;
closeOld = `          </div>
        </motion.div>
      </motion.div>
      </>)}`;
closeNew = `          </div>
          {showPreview ? <HomeEditorPreview activeTab={activeTab} refreshKey={previewTick} /> : null}
          </div>
        </div>
      </div>
      </>)}`;

if (c.includes(closeOld)) c = c.replace(closeOld, closeNew);
else console.warn("close block missing");

// Remove duplicate add toolbars
const toolbarRe = /\n            <div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' \}\}>[\s\S]*?<\/div>\n            <div className="cms-item-grid">/g;
c = c.replace(toolbarRe, "\n            <div className=\"cms-item-grid\">");

// handleSave full also refresh preview
if (!c.includes("setPreviewTick")) {
  console.warn("preview tick missing");
} else if (!c.includes("setPreviewTick((t) => t + 1)") || !c.match(/handleSave[\s\S]*setPreviewTick/)) {
  c = c.replace(
    "setHasChanges(false);\n    } catch {\n      toast.error('L\u1ed7i khi l\u01b0u c\u1ea5u h\u00ecnh');\n    } finally {\n      setSaving(false);\n    }\n  };",
    "setHasChanges(false);\n      setPreviewTick((t) => t + 1);\n    } catch {\n      toast.error('L\u1ed7i khi l\u01b0u c\u1ea5u h\u00ecnh');\n    } finally {\n      setSaving(false);\n    }\n  };"
  );
}

fs.writeFileSync(file, c);
console.log("patched", {
  head: c.includes("HomeEditorSectionHead"),
  preview: c.includes("home-editor-split"),
  sectionSave: c.includes("handleSaveSection"),
});