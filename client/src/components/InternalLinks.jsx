import { Link } from 'react-router-dom';
import './InternalLinks.css';

/** Varied anchors pointing to pillar pages — rotate by seed to avoid identical anchors. */
const LINK_POOL = [
  { to: '/', text: 'Thắng Tin Học' },
  { to: '/gioi-thieu', text: 'Thầy Thắng Tin Học' },
  { to: '/gioi-thieu', text: 'Giới thiệu Thắng Tin Học' },
  { to: '/dich-vu', text: 'Khóa học Tin học văn phòng' },
  { to: '/dich-vu', text: 'Học Excel Online' },
  { to: '/dich-vu#hoc-1-kem-1', text: 'Đăng ký học 1 kèm 1' },
  { to: '/dich-vu#ultraviewer', text: 'Học online qua UltraViewer' },
  { to: '/courses', text: 'Học cùng Thắng Tin Học' },
  { to: '/lien-he', text: 'Đăng ký tư vấn học tin học' },
  { to: '/blog', text: 'Blog tin học văn phòng' },
];

/**
 * @param {{ seed?: string, title?: string, extra?: { to: string, text: string }[] }} props
 */
export default function InternalLinks({ seed = '', title = 'Tìm hiểu thêm', extra = [] }) {
  const start = seed ? seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % LINK_POOL.length : 0;
  const picked = [];
  for (let i = 0; i < 5 && picked.length < 5; i++) {
    const item = LINK_POOL[(start + i) % LINK_POOL.length];
    if (!picked.some((p) => p.to === item.to && p.text === item.text)) {
      picked.push(item);
    }
  }
  const links = [...picked, ...extra].slice(0, 6);

  return (
    <aside className="internal-links" aria-label={title}>
      <h2 className="internal-links-title">{title}</h2>
      <ul className="internal-links-list">
        {links.map((link) => (
          <li key={`${link.to}-${link.text}`}>
            <Link to={link.to}>{link.text}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
