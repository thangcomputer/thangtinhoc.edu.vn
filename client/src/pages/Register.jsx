import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from '../lib/api';
import { getDeviceId } from '../lib/deviceId';
import useAuthStore from '../store/authStore';
import AuthShell, { AuthField, AuthDivider, AuthSwitch } from '../components/AuthShell';
import './Auth.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState('Thắng Tin Học');

  useEffect(() => {
    api.get('/settings').then((res) => {
      const s = res.data.data;
      if (s?.site_logo) setSiteLogo(s.site_logo);
      if (s?.site_name) setSiteName(s.site_name);
    }).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp');
    }
    if (form.password.length < 8) {
      return toast.error('Mật khẩu phải có ít nhất 8 ký tự');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
      });
      login(res.data.data.user, res.data.data.token);
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
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
      const { user, token, deviceId: serverDeviceId } = res.data.data;
      login(user, token, serverDeviceId);
      toast.success('Đăng ký với Google thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký với Google thất bại');
    }
  };

  return (
    <AuthShell
      siteLogo={siteLogo}
      siteName={siteName}
      title="Tạo tài khoản"
      subtitle="Chỉ mất khoảng 1 phút"
      panelTitle="Bắt đầu học ngay hôm nay"
      panelLead="Tạo tài khoản để đăng ký lớp 1 kèm 1 và theo dõi tiến độ học tập."
      panelItems={[
        'Hàng trăm bài học & khóa học',
        'Học trên mọi thiết bị',
        'Theo dõi tiến độ cá nhân',
      ]}
      footer={
        <AuthSwitch>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </AuthSwitch>
      }
    >
      {googleClientId && (
        <>
          <div className="auth-google-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Đăng ký Google thất bại')}
              theme="filled_blue"
              shape="pill"
              text="signup_with"
              locale="vi"
            />
          </div>
          <AuthDivider />
        </>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-form-grid">
          <AuthField label="Họ tên" icon={User}>
            <input
              type="text"
              required
              className="auth-input"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={set('fullName')}
              autoComplete="name"
            />
          </AuthField>

          <AuthField label="Điện thoại" icon={Phone} hint="Không bắt buộc">
            <input
              type="tel"
              className="auth-input"
              placeholder="0901 234 567"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
            />
          </AuthField>

          <AuthField label="Email" icon={Mail} className="auth-field--full">
            <input
              type="email"
              required
              className="auth-input"
              placeholder="email@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </AuthField>

          <AuthField label="Mật khẩu" icon={Lock}>
            <input
              type={showPass ? 'text' : 'password'}
              required
              className="auth-input auth-input--eye"
              placeholder="Tối thiểu 8 ký tự"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
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

          <AuthField label="Xác nhận" icon={Lock}>
            <input
              type={showPass ? 'text' : 'password'}
              required
              className="auth-input"
              placeholder="Nhập lại"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              autoComplete="new-password"
            />
          </AuthField>
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function Register() {
  if (!googleClientId) return <RegisterPage />;
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <RegisterPage />
    </GoogleOAuthProvider>
  );
}
