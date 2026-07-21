import { useState, useEffect, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Award, Users, Target, Heart, Star, Zap, Monitor, Video,
  Headphones, Route, CheckCircle, Quote, Send, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ScrollReveal from '../components/ScrollReveal';
import SeoBreadcrumb from '../components/SeoBreadcrumb';
import CourseCard from '../components/CourseCard';
import api from '../lib/api';
import {
  usePageSeo,
  buildPersonSchema,
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  SITE_URL,
} from '../lib/usePageSeo';
import './About.css';

const LEARNING_MODES = [
  { icon: Monitor, title: 'Học Online', desc: 'Học mọi lúc, mọi nơi — chỉ cần máy tính và kết nối mạng ổn định.' },
  { icon: Users, title: 'Học 1 kèm 1', desc: 'Lộ trình cá nhân hóa theo mục tiêu và trình độ của từng học viên.' },
  { icon: Video, title: 'Học qua UltraViewer', desc: 'Giáo viên điều khiển và hướng dẫn trực tiếp trên máy của bạn.' },
  { icon: Headphones, title: 'Có ghi hình buổi học', desc: 'Xem lại bài bất cứ khi nào — củng cố kiến thức sau giờ học.' },
  { icon: Heart, title: 'Hỗ trợ sau khóa', desc: 'Được hỗ trợ khi gặp tình huống thực tế tại công việc — hỏi lại bất cứ lúc nào.' },
  { icon: Route, title: 'Lộ trình cá nhân hóa', desc: 'Từ người mới bắt đầu đến nâng cao Excel, Word, PowerPoint.' },
];

const FAQ = [
  {
    q: 'Thầy Thắng Tin Học là ai?',
    a: 'Thắng Tin Học (Thầy Thắng) là giáo viên chuyên đào tạo tin học văn phòng — Word, Excel, PowerPoint — theo hình thức online 1 kèm 1 và học từ xa qua UltraViewer.',
  },
  {
    q: 'Học với Thắng Tin Học có phù hợp người mới không?',
    a: 'Có. Lộ trình bắt đầu từ thao tác cơ bản trên máy tính, sau đó đi sâu Word/Excel theo nhu cầu công việc thực tế.',
  },
  {
    q: 'Học online qua UltraViewer có hiệu quả không?',
    a: 'Rất hiệu quả vì giáo viên nhìn và thao tác trực tiếp trên máy học viên, sửa lỗi ngay — giống ngồi cạnh nhau.',
  },
  {
    q: 'Làm sao để đăng ký học 1 kèm 1?',
    a: 'Bạn có thể gửi form bên dưới, gọi điện, hoặc vào trang Liên hệ / Đăng ký khóa học trên website thangtinhoc.edu.vn.',
  },
];

const TESTIMONIALS = [
  { name: 'Chị Lan Anh', role: 'Nhân viên văn phòng', text: 'Trước đây em sợ Excel. Sau vài buổi 1 kèm 1 với thầy, em tự làm báo cáo và bảng lương được rồi.' },
  { name: 'Anh Minh', role: 'Kế toán', text: 'Học online qua UltraViewer rất tiện. Thầy sửa file trực tiếp trên máy em, hiểu bài nhanh hơn tự học YouTube.' },
  { name: 'Bạn Hương', role: 'Sinh viên', text: 'Em học Word – PowerPoint để làm đồ án. Thầy giải thích rõ, có ghi hình xem lại rất hữu ích.' },
];

export default function About() {
  const { settings: ctxSettings } = useOutletContext() || {};
  const [settings, setSettings] = useState(ctxSettings || {});
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (ctxSettings) setSettings(ctxSettings);
    else api.get('/settings').then((res) => setSettings(res.data.data || {})).catch(() => {});
    api.get('/courses?featured=true&limit=3').then((res) => setCourses(res.data.data || [])).catch(() => {});
  }, [ctxSettings]);

  const siteName = settings?.site_name || 'Thắng Tin Học';

  const seo = useMemo(() => ({
    title: 'Thắng Tin Học là ai? | Thầy Thắng Tin Học - Đào tạo tin học văn phòng',
    description: 'Thắng Tin Học (Thầy Thắng) — giáo viên đào tạo tin học văn phòng, Excel, Word, PowerPoint online 1 kèm 1 qua UltraViewer. Tìm hiểu kinh nghiệm, khóa học và đăng ký học ngay.',
    keywords: 'Thắng Tin Học, thầy thắng tin học, thắng tin học là ai, thầy thắng tin học là ai, gia sư tin học, dạy Excel 1 kèm 1, học online UltraViewer',
    canonical: `${SITE_URL}/gioi-thieu`,
    schemas: [
      buildPersonSchema(),
      buildOrganizationSchema(),
      buildBreadcrumbSchema([
        { name: 'Trang chủ', url: '/' },
        { name: 'Giới thiệu Thắng Tin Học', url: '/gioi-thieu' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }), []);

  usePageSeo(seo);

  const socials = useMemo(() => {
    try {
      return JSON.parse(settings?.social_buttons || '[]').filter((b) => b.url);
    } catch {
      return [];
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }
    setSending(true);
    try {
      await api.post('/contacts', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: '',
        subject: 'Đăng ký học với Thắng Tin Học',
        content: form.message.trim() || 'Tôi muốn được tư vấn học tin học văn phòng 1 kèm 1.',
      });
      toast.success('Đã gửi đăng ký! Thắng Tin Học sẽ liên hệ sớm.');
      setForm({ name: '', phone: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi được. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-bg" aria-hidden />
        <div className="container about-hero-grid">
          <div className="about-hero-copy">
            <SeoBreadcrumb items={[
              { name: 'Trang chủ', to: '/' },
              { name: 'Giới thiệu Thắng Tin Học' },
            ]} />
            <p className="about-eyebrow">Giảng viên · Tin học văn phòng</p>
            <h1>
              <span className="highlight">{siteName}</span>
              <span className="about-hero-rest"> là ai?</span>
            </h1>
            <p className="about-hero-desc">
              Giáo viên đào tạo tin học văn phòng — giúp người mới và nhân viên văn phòng
              thành thạo Word, Excel, PowerPoint qua học online 1 kèm 1 và học từ xa.
            </p>
            <div className="about-hero-ctas">
              <Link to="/dich-vu" className="btn btn-primary about-btn-primary">Xem dịch vụ đào tạo</Link>
              <Link to="/lien-he" className="btn btn-ghost about-btn-secondary">Đăng ký học 1 kèm 1</Link>
            </div>
            <ul className="about-hero-trust">
              <li>Online · Từ xa</li>
              <li>1 kèm 1</li>
              <li>UltraViewer</li>
              <li>Có ghi hình</li>
            </ul>
          </div>

          <aside className="about-hero-card" aria-label="Điểm nổi bật">
            <div className="about-hero-card-badge">
              <Award size={16} /> Thầy Thắng Tin Học
            </div>
            <p className="about-hero-card-quote">
              “Mỗi học viên một lộ trình — mục tiêu là dùng được tin học trong công việc thật.”
            </p>
            <ul className="about-hero-card-list">
              <li><CheckCircle size={16} /> Word · Excel · PowerPoint</li>
              <li><CheckCircle size={16} /> Học qua UltraViewer / Zoom</li>
              <li><CheckCircle size={16} /> Lộ trình cá nhân hóa</li>
              <li><CheckCircle size={16} /> Hỗ trợ sau khóa học</li>
            </ul>
            <Link to="/gioi-thieu#dang-ky" className="about-hero-card-link">
              Đăng ký tư vấn nhanh →
            </Link>
          </aside>
        </div>
      </section>

      <section className="about-intro">
        <div className="container about-intro-grid">
          <ScrollReveal animation="fade-up">
            <h2>Giới thiệu <span className="highlight">Thắng Tin Học</span></h2>
            <p>
              Nếu bạn đang tìm <strong>thầy thắng tin học</strong> để học máy tính từ đầu,
              học Excel phục vụ công việc, hoặc cần gia sư tin học online — bạn đang ở đúng chỗ.
              Thắng Tin Học tập trung đào tạo thực chiến: thao tác trên máy thật, bài tập theo
              nghiệp vụ văn phòng, và hỗ trợ sau khóa học.
            </p>
            <p>
              Phương pháp nổi bật là <Link to="/dich-vu#ultraviewer">học qua UltraViewer</Link> —
              giáo viên hướng dẫn trực tiếp trên máy học viên — kết hợp ghi hình buổi học để xem lại.
            </p>
            <ul className="about-checklist">
              {['Học máy vi tính cho người mới bắt đầu', 'Khóa học Word Excel theo nhu cầu', 'Dạy Excel / Word 1 kèm 1', 'Học máy tính online & từ xa'].map((t) => (
                <li key={t}><CheckCircle size={16} /> {t}</li>
              ))}
            </ul>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <blockquote className="about-quote">
              <Quote size={28} />
              <p>
                “Mỗi học viên một lộ trình. Mục tiêu không phải học xong khóa, mà là tự tin
                dùng tin học ngay trong công việc hàng ngày.”
              </p>
              <cite>— Thắng Tin Học</cite>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      <section className="about-stats">
        <div className="container">
          <div className="stats-grid">
            {[
              { num: '1 kèm 1', label: 'Hình thức ưu tiên' },
              { num: 'Online', label: 'Học từ xa toàn quốc' },
              { num: 'UltraViewer', label: 'Hướng dẫn trên máy' },
              { num: 'Ghi hình', label: 'Xem lại buổi học' },
            ].map((s, i) => (
              <ScrollReveal key={s.label} animation="fade-up" delay={i * 80}>
                <div className="stat-card">
                  <span className="stat-num">{s.num}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-values" id="hinh-thuc-hoc">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="section-center" style={{ marginBottom: '32px' }}>
              <h2 className="section-title">Hình thức học cùng <span className="highlight">Thắng Tin Học</span></h2>
              <p className="section-sub">Online · Từ xa · 1 kèm 1 · UltraViewer · Hỗ trợ sau khóa</p>
            </div>
          </ScrollReveal>
          <div className="values-grid values-grid-6">
            {LEARNING_MODES.map((v, i) => (
              <ScrollReveal key={v.title} animation="fade-up" delay={i * 60}>
                <div className="value-card">
                  <div className="value-icon"><v.icon size={22} /></div>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="section-center" style={{ marginBottom: '32px' }}>
              <h2 className="section-title">Giá trị <span className="highlight">cốt lõi</span></h2>
            </div>
          </ScrollReveal>
          <div className="values-grid">
            {[
              { icon: Target, title: 'Sứ mệnh', desc: 'Giúp mọi người tự tin dùng máy tính và tin học văn phòng trong công việc thực tế.' },
              { icon: Heart, title: 'Tận tâm', desc: 'Theo sát từng học viên — từ người chưa từng đụng Excel đến người cần nâng cao.' },
              { icon: Zap, title: 'Hiệu quả', desc: 'Học đi đôi với hành: thực hành trên file và tình huống công việc thật.' },
              { icon: Star, title: 'Tin cậy', desc: 'Minh bạch lộ trình, có ghi hình, hỗ trợ sau khóa — xây dựng uy tín lâu dài.' },
            ].map((v, i) => (
              <ScrollReveal key={v.title} animation="fade-up" delay={i * 80}>
                <div className="value-card">
                  <div className="value-icon"><v.icon size={22} /></div>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {courses.length > 0 && (
        <section className="about-courses">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="section-center" style={{ marginBottom: '28px' }}>
                <h2 className="section-title">Khóa học nổi bật</h2>
                <p className="section-sub">
                  Xem thêm tại <Link to="/dich-vu">trang Dịch vụ</Link> hoặc <Link to="/courses">danh sách khóa học</Link>.
                </p>
              </div>
            </ScrollReveal>
            <div className="about-courses-grid">
              {courses.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          </div>
        </section>
      )}

      <section className="about-testimonials">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="section-center" style={{ marginBottom: '28px' }}>
              <h2 className="section-title">Feedback học viên</h2>
            </div>
          </ScrollReveal>
          <div className="about-testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="about-testi-card">
                <Quote size={20} />
                <p>{t.text}</p>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {socials.length > 0 && (
        <section className="about-social">
          <div className="container section-center">
            <h2 className="section-title">Theo dõi Thắng Tin Học</h2>
            <p className="section-sub">TikTok · Facebook · YouTube và các kênh khác</p>
            <div className="about-social-links">
              {socials.map((b) => (
                <a key={b.id || b.label} href={b.url} target="_blank" rel="noopener noreferrer" className="about-social-btn" style={{ background: b.color || '#0f766e' }}>
                  {b.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="about-faq" id="faq">
        <div className="container">
          <h2 className="section-title section-center">Câu hỏi thường gặp</h2>
          <div className="about-faq-list">
            {FAQ.map((f) => (
              <details key={f.q} className="about-faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta" id="dang-ky">
        <div className="container">
          <div className="cta-box about-cta-form-wrap">
            <h2>Đăng ký học cùng Thắng Tin Học</h2>
            <p>Để lại thông tin — chúng tôi sẽ tư vấn lộ trình phù hợp (Word, Excel, PowerPoint, 1 kèm 1).</p>
            <form className="about-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Họ và tên"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoComplete="name"
              />
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                autoComplete="tel"
              />
              <textarea
                placeholder="Bạn muốn học gì? (Excel, Word, người mới...)"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                Gửi đăng ký
              </button>
            </form>
            <p className="about-cta-alt">
              Hoặc xem <Link to="/dich-vu">dịch vụ đào tạo</Link> · <Link to="/lien-he">liên hệ</Link> · <Link to="/">trang chủ Thắng Tin Học</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
