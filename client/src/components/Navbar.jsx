import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, User, LogOut, ChevronDown, LayoutDashboard, GraduationCap, PenTool, Briefcase, Activity } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { performLogout } from '../lib/logout';
import EnrollPopup from './EnrollPopup';
import SearchBox from './SearchBox';
import NotificationBell from './NotificationBell';
import './Navbar.css';

// Fix: \b\w breaks Vietnamese chars (e.g. "thắng" → "ThắNg"). Capitalize per word instead.
const capitalize = (s) =>
  s ? s.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

// Lấy tên hiển thị ngắn (từ cuối = tên riêng trong tiếng Việt)
const shortName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
};

export default function Navbar({ settings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
    // Tự mở popup đăng ký nếu URL có ?enroll=true
    if (location.search.includes('enroll=true')) {
      setEnrollOpen(true);
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await performLogout();
    navigate('/');
  };

  const adminHref = import.meta.env.VITE_ADMIN_URL || (import.meta.env.PROD ? '/admin' : 'http://localhost:5174');
  const adminLinkExternal = !adminHref.startsWith('/');

  const navLinks = [
    { to: '/', label: 'Trang Chủ' },
    { to: '/gioi-thieu', label: 'Giới Thiệu' },
    { to: '/courses', label: 'Khóa Học' },
    { to: '/blog', label: 'Blog' },
    { to: '/tuyen-dung', label: 'Tuyển Dụng' },
    { to: '/lien-he', label: 'Liên Hệ' },
  ];

  const closeDrawer = () => setIsOpen(false);

  const handleNavClick = () => {
    closeDrawer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnrollClick = () => {
    closeDrawer();
    setEnrollOpen(true);
  };

  return (
    <>
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isOpen ? 'menu-open' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeDrawer}>
          {settings?.site_logo ? (
            <img src={settings.site_logo} alt={settings?.site_name || 'Tin học 24h'} className="site-logo-img" />
          ) : (
            <>
              <div className="brand-icon">
                <BookOpen size={22} />
              </div>
              <div className="brand-text">
                <span className="brand-name">{settings?.site_name || 'Tin học 24h'}</span>
                <span className="brand-sub">Trung Tâm Đào Tạo</span>
              </div>
            </>
          )}
        </Link>

        <div className="navbar-links navbar-links--desktop">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {link.label}
            </Link>
          ))}
          <button type="button" className="nav-link enroll-nav-btn" onClick={() => setEnrollOpen(true)}>
            <PenTool size={14} /> Ghi Danh
          </button>
        </div>

        <div className="navbar-right">
          <NotificationBell />
          {isAuthenticated ? (
            <div className="user-menu-wrap" ref={menuRef}>
              <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-expanded={userMenuOpen}>
                <div className="user-avatar-wrap">
                  <div className="user-avatar">
                    {user?.avatar ? (
                      <img src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL?.replace('/api','')}${user.avatar}`} alt={shortName(user?.fullName)} />
                    ) : (
                      <span>{capitalize(user?.fullName)?.[0] || 'U'}</span>
                    )}
                  </div>
                  <span className="user-online-dot" aria-hidden="true" />
                </div>
                <span className="user-name">{shortName(user?.fullName)}</span>
                <ChevronDown size={13} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  {/* Header with avatar */}
                  <div className="user-info">
                    <div className="user-info-avatar">
                      {user?.avatar ? (
                        <img src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL?.replace('/api','')}${user.avatar}`} alt="" />
                      ) : (
                        <span>{capitalize(user?.fullName)?.[0] || 'U'}</span>
                      )}
                    </div>
                    <div className="user-info-text">
                      <p className="user-full-name">{capitalize(user?.fullName)}</p>
                      <p className="user-email">{user?.email}</p>
                      {user?.role === 'admin' && <span className="user-role-badge">Admin</span>}
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-group">
                    <Link to="/profile" className="dropdown-item">
                      <span className="dropdown-item-icon"><User size={15} /></span>
                      <span>Cài Đặt Tài Khoản</span>
                    </Link>
                    <Link to="/my-courses" className="dropdown-item">
                      <span className="dropdown-item-icon"><GraduationCap size={15} /></span>
                      <span>Khóa Học Của Tôi</span>
                    </Link>
                    <Link to="/my-activity" className="dropdown-item">
                      <span className="dropdown-item-icon"><Activity size={15} /></span>
                      <span>Hoạt Động Của Tôi</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <a
                        href={adminHref}
                        className="dropdown-item admin-item"
                        {...(adminLinkExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                      >
                        <span className="dropdown-item-icon"><LayoutDashboard size={15} /></span>
                        <span>Admin Panel</span>
                      </a>
                    )}
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-group">
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <span className="dropdown-item-icon"><LogOut size={15} /></span>
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">Đăng Nhập</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Đăng Ký</Link>
            </div>
          )}

          <button
            type="button"
            className="hamburger"
            aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <EnrollPopup isOpen={enrollOpen} onClose={() => setEnrollOpen(false)} />
    </nav>

    <div
      className={`nav-drawer-backdrop ${isOpen ? 'open' : ''}`}
      onClick={closeDrawer}
      aria-hidden={!isOpen}
    />

    <aside className={`nav-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <div className="nav-drawer-header">
        <span className="nav-drawer-title">Menu</span>
        <button type="button" className="nav-drawer-close" aria-label="Đóng menu" onClick={closeDrawer}>
          <X size={22} />
        </button>
      </div>

      <nav className="nav-drawer-body">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-drawer-link ${location.pathname === link.to ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            {link.label}
          </Link>
        ))}
        <button type="button" className="nav-drawer-link nav-drawer-enroll" onClick={handleEnrollClick}>
          <PenTool size={18} /> Ghi Danh
        </button>
      </nav>

      {!isAuthenticated && (
        <div className="nav-drawer-auth">
          <Link to="/login" className="btn btn-ghost btn-block" onClick={handleNavClick}>
            Đăng Nhập
          </Link>
          <Link to="/register" className="btn btn-primary btn-block" onClick={handleNavClick}>
            Đăng Ký
          </Link>
        </div>
      )}
    </aside>
    </>
  );
}
