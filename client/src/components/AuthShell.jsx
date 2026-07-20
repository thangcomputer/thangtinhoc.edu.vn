import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles } from 'lucide-react';

const DEFAULT_LOGO = '/logo.webp';

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
  panelLead = 'Học Word, Excel, PowerPoint online 1 kèm 1 cùng Thầy Thắng.',
  panelItems = [],
  footer,
  children,
}) {
  const logoSrc = siteLogo || DEFAULT_LOGO;
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
            <div className="auth-panel-top">
              <Link to="/" className="auth-panel-brand" aria-label={siteName}>
                <img
                  src={logoSrc}
                  alt={siteName}
                  className="auth-panel-logo"
                  width="160"
                  height="48"
                  decoding="async"
                />
              </Link>
              <span className="auth-panel-badge">
                <Sparkles size={12} /> Học online 1 kèm 1
              </span>
            </div>

            <div className="auth-panel-mid">
              <h2 className="auth-panel-title">{panelTitle}</h2>
              {panelLead && <p className="auth-panel-lead">{panelLead}</p>}
              <ul className="auth-panel-list">
                {items.map((text) => (
                  <li key={text}>
                    <CheckCircle2 size={18} strokeWidth={2} />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="auth-panel-foot">
              UltraViewer · Zoom · Ghi hình buổi học
            </p>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-head">
            <Link to="/" className="auth-brand" aria-label={siteName}>
              <img
                src={logoSrc}
                alt={siteName}
                className="auth-brand-logo"
                width="180"
                height="56"
                decoding="async"
              />
            </Link>
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
