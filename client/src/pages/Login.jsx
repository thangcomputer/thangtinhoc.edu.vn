import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from '../lib/api';
import { getDeviceId } from '../lib/deviceId';
import useAuthStore from '../store/authStore';
import AuthShell, { AuthField, AuthDivider, AuthSwitch } from '../components/AuthShell';
import './Auth.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState('Thắng Tin Học');

  useEffect(() => {
    api.get('/settings').then((res) => {
      const s = res.data.data;
      if (s?.site_logo) setSiteLogo(s.site_logo);
      if (s?.site_name) setSiteName(s.site_name);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const res = await api.post('/auth/login', { ...form, deviceId }, {
        headers: { 'X-Device-Id': deviceId },
      });
      const { user, token, sessionWarning, deviceId: serverDeviceId } = res.data.data;
      login(user, token, serverDeviceId);
      if (sessionWarning) toast(sessionWarning, { icon: '⚠️', duration: 6000 });
      toast.success('Đăng nhập thành công!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const deviceId = getDeviceId();
      const res = await api.post('/auth/google', {
        credential: credentialResponse.credential,
        deviceId,
      });
      const { user, token, sessionWarning, deviceId: serverDeviceId } = res.data.data;
      login(user, token, serverDeviceId);
      if (sessionWarning) toast(sessionWarning, { icon: '⚠️', duration: 6000 });
      toast.success('Đăng nhập với Google thành công!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập với Google thất bại');
    }
  };

  return (
    <AuthShell
      siteLogo={siteLogo}
      siteName={siteName}
      title="Đăng nhập"
      subtitle="Vào lớp học và tiếp tục lộ trình của bạn"
      panelTitle="Chào mừng trở lại!"
      panelLead="Đăng nhập để tiếp tục lộ trình Word, Excel, PowerPoint cùng Thầy Thắng."
      panelItems={[
        'Tiếp tục khóa học đang học',
        'Đồng bộ tiến độ trên mọi thiết bị',
        'Quản lý tài khoản & chứng chỉ',
      ]}
      footer={
        <AuthSwitch>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </AuthSwitch>
      }
    >
      {googleClientId && (
        <>
          <div className="auth-google-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Đăng nhập Google thất bại')}
              theme="filled_blue"
              shape="pill"
              locale="vi"
            />
          </div>
          <AuthDivider />
        </>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField label="Email" icon={Mail}>
          <input
            type="email"
            required
            className="auth-input"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
        </AuthField>

        <AuthField
          label="Mật khẩu"
          icon={Lock}
          labelExtra={
            <Link to="/forgot-password" className="auth-link-muted">
              Quên mật khẩu?
            </Link>
          }
        >
          <input
            type={showPass ? 'text' : 'password'}
            required
            className="auth-input auth-input--eye"
            placeholder="Nhập mật khẩu"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="auth-input-eye"
            onClick={() => setShowPass(!showPass)}
            aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </AuthField>

        <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function Login() {
  if (!googleClientId) return <LoginPage />;
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LoginPage />
    </GoogleOAuthProvider>
  );
}
