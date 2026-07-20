import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import AuthShell, { AuthField, AuthSwitch } from '../components/AuthShell';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (password !== confirmPassword) {
      return toast.error('Mật khẩu nhập lại không khớp!');
    }
    if (password.length < 8) {
      return toast.error('Mật khẩu phải từ 8 ký tự trở lên');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, token, newPassword: password });
      toast.success(res.data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Link khôi phục không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <AuthShell
        siteLogo={siteLogo}
        siteName={siteName}
        title="Liên kết không hợp lệ"
        subtitle="Không tìm thấy thông tin xác thực."
        panelTitle="Đặt lại mật khẩu"
        panelItems={[
          'Dùng link trong email gần nhất',
          'Link chỉ dùng được một lần',
          'Yêu cầu lại nếu đã hết hạn',
        ]}
        footer={
          <AuthSwitch>
            <Link to="/forgot-password">Yêu cầu liên kết mới</Link>
          </AuthSwitch>
        }
      >
        <Link to="/forgot-password" className="btn btn-primary auth-submit">
          Yêu cầu lại
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      siteLogo={siteLogo}
      siteName={siteName}
      title="Tạo mật khẩu mới"
      subtitle={`Thiết lập mật khẩu mới cho ${email}`}
      panelTitle="Bảo mật tài khoản"
      panelItems={[
        'Chọn mật khẩu mạnh, dễ nhớ',
        'Không dùng lại mật khẩu cũ',
        'Đăng nhập ngay sau khi đổi',
      ]}
      footer={
        <AuthSwitch>
          Nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
        </AuthSwitch>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField label="Mật khẩu mới" icon={Lock}>
          <input
            type="password"
            required
            className="auth-input"
            placeholder="Tối thiểu 8 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </AuthField>

        <AuthField label="Nhập lại mật khẩu" icon={Lock}>
          <input
            type="password"
            required
            className="auth-input"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </AuthField>

        <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
          <Save size={18} />
          {loading ? 'Đang lưu...' : 'Xác nhận'}
        </button>
      </form>
    </AuthShell>
  );
}
