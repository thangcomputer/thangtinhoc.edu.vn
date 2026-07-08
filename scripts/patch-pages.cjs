const fs = require("fs");

function patch(file, rules) {
  let c = fs.readFileSync(file, "utf8");
  for (const [from, to] of rules) {
    if (c.includes(from)) c = c.replace(from, to);
    else if (to && !c.includes(to.slice(0, 40))) console.warn("miss", file, from.slice(0, 40));
  }
  fs.writeFileSync(file, c);
}

patch("c:/Users/thang/Desktop/WEB/admin/src/pages/Registrations.jsx", [
  ["import Loading from '../components/Loading';", "import Loading from '../components/Loading';\nimport EmptyState from '../components/EmptyState';"],
  ['<tr><td colSpan={6} style={{ textAlign: \'center\', padding: \'32px\', color: \'var(--text-muted)\' }}>Chưa có đăng ký nào</td></tr>',
   '<tr><td colSpan={6}><EmptyState icon={ClipboardList} title="Chưa có ghi danh" message="Thử đổi bộ lọc hoặc từ khóa." /></td></tr>'],
  ['style={{ color: \'var(--danger)\' }}><Trash2 size={14} /></button>',
   'style={{ color: \'var(--danger)\' }} aria-label="Xóa ghi danh"><Trash2 size={14} /></button>'],
]);

patch("c:/Users/thang/Desktop/WEB/admin/src/pages/RecruitmentAdmin.jsx", [
  ["import Loading from '../components/Loading';", "import Loading from '../components/Loading';\nimport EmptyState from '../components/EmptyState';"],
  ['<tr><td colSpan={5} style={{ textAlign: \'center\', padding: \'32px\', color: \'var(--text-muted)\' }}>Chưa có ứng viên nào</td></tr>',
   '<tr><td colSpan={5}><EmptyState icon={Briefcase} title="Chưa có ứng viên" message="Thử đổi bộ lọc hoặc từ khóa." /></td></tr>'],
  ['style={{ color: \'var(--danger)\' }}><Trash2 size={14} /></button>',
   'style={{ color: \'var(--danger)\' }} aria-label="Xóa hồ sơ"><Trash2 size={14} /></button>'],
]);

patch("c:/Users/thang/Desktop/WEB/admin/src/pages/LessonManager.jsx", [
  ["import Loading from '../components/Loading';", "import Loading from '../components/Loading';\nimport EmptyState from '../components/EmptyState';"],
  ['<tr><td colSpan="7" style={{ textAlign: \'center\', padding: \'3rem\', color: \'var(--text-muted)\' }}>Chưa có bài học nào</td></tr>',
   '<tr><td colSpan="7"><EmptyState icon={BookOpen} title="Chưa có bài học" message="Nhấn Thêm Bài Mới để bắt đầu." actionLabel="Thêm bài mới" onAction={() => openForm()} /></td></tr>'],
  ['title="Sửa"', 'title="Sửa" aria-label="Sửa bài học"'],
  ['title="Xóa"', 'title="Xóa" aria-label="Xóa bài học"'],
]);

patch("c:/Users/thang/Desktop/WEB/admin/src/pages/Submissions.jsx", [
  ["import Loading from '../components/Loading';", "import Loading from '../components/Loading';\nimport EmptyState from '../components/EmptyState';"],
  ['<td colSpan="8" style={{ textAlign: \'center\', padding: \'3rem\', color: \'var(--text-muted)\' }}>\n                    Chưa có bài tập nào\n                  </td>',
   '<td colSpan="8"><EmptyState icon={FileText} title="Chưa có bài nộp" message="Học viên chưa nộp bài cho khóa học này." /></td>'],
  ['<motion.div className="table-wrap">', '<div className="table-wrap responsive-table">'],
]);

let sub = fs.readFileSync("c:/Users/thang/Desktop/WEB/admin/src/pages/Submissions.jsx", "utf8");
sub = sub.replace('<div className="table-wrap">', '<div className="table-wrap responsive-table">');
fs.writeFileSync("c:/Users/thang/Desktop/WEB/admin/src/pages/Submissions.jsx", sub);

console.log("pages patched");