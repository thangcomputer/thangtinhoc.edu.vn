import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import './CookieConsent.css';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small delay before showing
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="animate-fade-in cookie-consent">
      <div className="cookie-consent-icon">
        <Cookie size={24} />
      </div>
      <div>
        <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Quản lý Cookie</h4>
        <p className="cookie-consent-text">
          Chúng tôi sử dụng cookie để lưu trữ phiên đăng nhập và cải thiện trải nghiệm học tập của bạn trên nền tảng.
        </p>
        <div className="cookie-consent-actions">
          <button type="button" onClick={acceptCookies} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            Đồng Ý
          </button>
          <a href="/lien-he" className="cookie-consent-link">
            Chính sách bảo mật
          </a>
        </div>
      </div>
    </div>
  );
}
