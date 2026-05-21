import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react';

export function AuthField({ label, icon: Icon, children, hint, labelExtra, className = '' }) {
  return (
    <div className={`auth-field ${className}`.trim()}>
      {(label || labelExtra) && (
        <div className="auth-field-head">
          {label && <label>{label}</label>}
          {labelExtra}
        </div>
      )}
      <div className="auth-input-wrap">
        {Icon && <Icon size={18} className="auth-input-icon" strokeWidth={2} />}
        {children}
      </div>
      {hint && <p className="auth-field-hint">{hint}</p>}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="auth-divider" role="separator">
      <span>hoặc dùng email</span>
    </div>
  );
}

export default function AuthShell({
  siteLogo,
  siteName = 'Thắng Tin Học',
  title,
  subtitle,
  panelTitle,
  panelItems = [],
  footer,
  children,
}) {
  const items = panelItems.length
    ? panelItems
    : [
        'Truy cập khóa học đã mua',
        'Theo dõi tiến độ học tập',
        'Nhận thông báo & chứng chỉ',
      ];

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden>
        <div className="auth-orb orb1" />
        <div className="auth-orb orb2" />
        <div className="auth-grid" />
      </div>

      <div className="auth-shell">
        <aside className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-panel-badge">
              <Sparkles size={14} />
              {siteName}
            </div>
            <h2 className="auth-panel-title">{panelTitle}</h2>
            <ul className="auth-panel-list">
              {items.map((text) => (
                <li key={text}>
                  <GraduationCap size={18} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-head">
            <div className="auth-brand">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="auth-brand-logo" />
              ) : (
                <div className="auth-brand-icon">
                  <BookOpen size={22} />
                </div>
              )}
            </div>
            <h1 className="auth-title">{title}</h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          </div>

          {children}

          {footer}
        </div>
      </div>
    </div>
  );
}

export function AuthSwitch({ children }) {
  return <p className="auth-switch">{children}</p>;
}
