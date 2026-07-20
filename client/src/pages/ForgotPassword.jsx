import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import AuthShell, { AuthField, AuthSwitch } from '../components/AuthShell';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
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
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setIsSent(true);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      siteLogo={siteLogo}
      siteName={siteName}
      title="Quên mật khẩu"
      subtitle={
        isSent
          ? 'Kiểm tra hộp thư (và thư rác) để lấy liên kết khôi phục.'
          : 'Nhập email để nhận liên kết đặt lại mật khẩu.'
      }
      panelTitle="Khôi phục tài khoản"
      panelItems={[
        'Nhận link đặt lại qua email',
        'Bảo mật bằng token có thời hạn',
        'Đăng nhập lại ngay sau khi đổi',
      ]}
      footer={
        <AuthSwitch>
          <Link to="/login" className="auth-back-link">
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </Link>
        </AuthSwitch>
      }
    >
      {isSent ? (
        <Link to="/login" className="btn btn-primary auth-submit">
          Quay lại đăng nhập
        </Link>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <AuthField label="Email" icon={Mail}>
            <input
              type="email"
              required
              className="auth-input"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </AuthField>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            <Send size={18} />
            {loading ? 'Đang gửi...' : 'Gửi liên kết'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
