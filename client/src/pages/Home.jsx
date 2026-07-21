import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Star, Users, BookOpen, Award, TrendingUp,
  CheckCircle, Zap, Shield, Clock, ChevronRight, Quote,
  GraduationCap, Monitor, Sparkles,
  Target, MessageSquare, ChevronDown, ChevronUp, Trophy,
} from 'lucide-react';
import api from '../lib/api';
import { sanitizeHTML } from '../lib/sanitize';
import CourseCard from '../components/CourseCard';
import ScrollReveal, { StaggerReveal } from '../components/ScrollReveal';
import VideoPlayer from '../components/VideoPlayer';
import YoutubeFacade from '../components/YoutubeFacade';
import {
  usePageSeo,
  buildPersonSchema,
  buildOrganizationSchema,
  SITE_URL,
  SITE_NAME,
} from '../lib/usePageSeo';
import { getZaloChatUrl, isExternalHref } from '../lib/zalo';
import './Home.css';

const IconMap = {
  Zap, Shield, Award, Users, Clock, TrendingUp, BookOpen, Target,
  Monitor, GraduationCap, CheckCircle, Star, MessageSquare, Sparkles,
};

function ZaloIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 614.501 613.667" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M464.721,301.399c-13.984-0.014-23.707,11.478-23.944,28.312c-0.251,17.771,9.168,29.208,24.037,29.202c14.287-0.007,23.799-11.095,24.01-27.995C489.028,313.536,479.127,301.399,464.721,301.399z" />
      <path d="M291.83,301.392c-14.473-0.316-24.578,11.603-24.604,29.024c-0.02,16.959,9.294,28.259,23.496,28.502c15.072,0.251,24.592-10.87,24.539-28.707C315.214,313.318,305.769,301.696,291.83,301.392z" />
      <path d="M310.518,3.158C143.102,3.158,7.375,138.884,7.375,306.3s135.727,303.142,303.143,303.142c167.415,0,303.143-135.727,303.143-303.142S477.933,3.158,310.518,3.158z M217.858,391.083c-33.364,0.818-66.828,1.353-100.133-0.343c-21.326-1.095-27.652-18.647-14.248-36.583c21.55-28.826,43.886-57.065,65.792-85.621c2.546-3.305,6.214-5.996,7.15-12.705c-16.609,0-32.784,0.04-48.958-0.013c-19.195-0.066-28.278-5.805-28.14-17.652c0.132-11.768,9.175-17.329,28.397-17.348c25.159-0.026,50.324-0.06,75.476,0.026c9.637,0.033,19.604,0.105,25.304,9.789c6.22,10.561,0.284,19.512-5.646,27.454c-21.26,28.497-43.015,56.624-64.559,84.902c-2.599,3.41-5.119,6.88-9.453,12.725c23.424,0,44.123-0.053,64.816,0.026c8.674,0.026,16.662,1.873,19.941,11.267C237.892,379.329,231.368,390.752,217.858,391.083z M350.854,330.211c0,13.417-0.093,26.841,0.039,40.265c0.073,7.599-2.599,13.647-9.512,17.084c-7.296,3.642-14.71,3.028-20.304-2.968c-3.997-4.281-6.214-3.213-10.488-0.422c-17.955,11.728-39.908,9.96-56.597-3.866c-29.928-24.789-30.026-74.803-0.211-99.776c16.194-13.562,39.592-15.462,56.709-4.143c3.951,2.619,6.201,4.815,10.396-0.053c5.39-6.267,13.055-6.761,20.271-3.357c7.454,3.509,9.935,10.165,9.776,18.265C350.67,304.222,350.86,317.217,350.854,330.211z M395.617,369.579c-0.118,12.837-6.398,19.783-17.196,19.908c-10.779,0.132-17.593-6.966-17.646-19.512c-0.179-43.352-0.185-86.696,0.007-130.041c0.059-12.256,7.302-19.921,17.896-19.222c11.425,0.752,16.992,7.448,16.992,18.833c0,22.104,0,44.216,0,66.327C395.677,327.105,395.828,348.345,395.617,369.579z M463.981,391.868c-34.399-0.336-59.037-26.444-58.786-62.289c0.251-35.66,25.304-60.713,60.383-60.396c34.631,0.304,59.374,26.306,58.998,61.986C524.207,366.492,498.534,392.205,463.981,391.868z" />
    </svg>
  );
}

/** Nút tư vấn — mở cùng link Zalo với nút nổi bên phải */
function ZaloConsultButton({ href, className = '', children, size = 'lg' }) {
  const label = children || 'Đăng ký tư vấn Zalo';
  const cls = `btn-zalo btn-zalo--${size} ${className}`.trim();
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        <ZaloIcon size={size === 'lg' ? 22 : 18} />
        <span>{label}</span>
      </a>
    );
  }
  return (
    <Link to={href} className={cls}>
      <ZaloIcon size={size === 'lg' ? 22 : 18} />
      <span>{label}</span>
    </Link>
  );
}

const MARKETING_HIDDEN = {
  stats: true,
  'visual-learning': true,
  courses: true,
  partners: true,
};

export default function Home({ settings }) {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  const sectionIdsRef = useRef([]);

  const zaloHref = useMemo(() => getZaloChatUrl(settings), [settings]);

  const homeSeo = useMemo(() => ({
    title: `${SITE_NAME} — Học tin học online 1 kèm 1 | Tư vấn Zalo`,
    description: settings?.site_description
      || 'Tuyển sinh học tin học văn phòng online 1 kèm 1 tại Thắng Tin Học. Hướng dẫn tận tâm, sửa bài trực tiếp qua UltraViewer. Nhắn Zalo để được tư vấn lộ trình miễn phí.',
    keywords: 'học tin học 1 kèm 1, học Excel online, học Word online, UltraViewer, tuyển sinh tin học, Thắng Tin Học, tư vấn Zalo, luyện thi MOS, GMetrix',
    canonical: `${SITE_URL}/`,
    schemas: [buildOrganizationSchema(), buildPersonSchema()],
  }), [settings?.site_description]);

  usePageSeo(homeSeo);

  // Parse section_order & section_visibility early (for courses fetch)
  const defaultOrder = ['hero', 'features', 'mos', 'learning-path', 'testimonials', 'cta'];
  let sectionOrder = defaultOrder;
  try {
    const parsed = JSON.parse(settings?.section_order || '[]');
    if (parsed.length > 0) {
      sectionOrder = parsed;
      // CMS cũ chưa có mos → chèn sau features (hoặc đầu danh sách)
      if (!sectionOrder.includes('mos')) {
        const fi = sectionOrder.indexOf('features');
        sectionOrder = fi >= 0
          ? [...sectionOrder.slice(0, fi + 1), 'mos', ...sectionOrder.slice(fi + 1)]
          : ['mos', ...sectionOrder];
      }
    }
  } catch (e) { /* keep default */ }

  let sectionVisibility = { ...MARKETING_HIDDEN };
  try {
    const parsed = JSON.parse(settings?.section_visibility || '{}');
    sectionVisibility = { ...MARKETING_HIDDEN, ...parsed };
  } catch (e) { /* keep defaults */ }

  const showCourses = sectionOrder.includes('courses') && !sectionVisibility.courses;

  useEffect(() => {
    if (!showCourses) return undefined;
    setLoading(true);
    api.get('/courses?featured=true&limit=6').then(res => {
      setFeaturedCourses(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
    return undefined;
  }, [showCourses]);

  useEffect(() => {
    if (!showPromo) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showPromo]);

  useEffect(() => {
    if (settings?.promo_enabled !== 'true') return undefined;
    const dismissed = sessionStorage.getItem('promo_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setShowPromo(true), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [settings]);

  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY > 100);
      const ids = sectionIdsRef.current;
      if (!ids.length) return;
      const scrollPos = window.scrollY + window.innerHeight / 2;
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.offsetTop <= scrollPos) {
          setCurrentSection(i);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLastSection = currentSection >= (sectionIdsRef.current.length || 1) - 1;

  const handleNavClick = () => {
    const ids = sectionIdsRef.current;
    if (isLastSection) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const nextId = ids[currentSection + 1];
      const el = document.getElementById(nextId);
      if (el) {
        window.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' });
      }
    }
  };

  const settingsLoaded = settings !== null && settings !== undefined;
  const anim = {
    hero: settingsLoaded ? (settings.anim_hero || 'fade-up') : 'none',
    stats: settingsLoaded ? (settings.anim_stats || 'fade-up') : 'none',
    features: settingsLoaded ? (settings.anim_features || 'fade-up') : 'none',
    learningPath: settingsLoaded ? (settings.anim_learning_path || 'fade-up') : 'none',
    visual: settingsLoaded ? (settings.anim_visual || 'fade-right') : 'none',
    testimonials: settingsLoaded ? (settings.anim_testimonials || 'fade-up') : 'none',
    partners: settingsLoaded ? (settings.anim_partners || 'zoom-in') : 'none',
    cta: settingsLoaded ? (settings.anim_cta || 'fade-up') : 'none',
  };

  let features = [];
  try { features = JSON.parse(settings?.home_features || '[]'); } catch (e) { features = []; }
  if (features.length === 0) {
    features = [
      { icon: 'Users', title: 'Học online 1 kèm 1', desc: 'Một thầy – một trò. Lịch linh hoạt, tiến độ theo đúng khả năng của bạn — không bị bỏ lại phía sau.' },
      { icon: 'Monitor', title: 'Sửa bài trực tiếp trên máy bạn', desc: 'Học qua UltraViewer: thầy điều khiển và hướng dẫn ngay trên máy tính của bạn, hiệu quả như ngồi cạnh nhau.' },
      { icon: 'Target', title: 'Lộ trình riêng cho từng người', desc: 'Word, Excel, PowerPoint hay tin học văn phòng — thiết kế đúng mục tiêu công việc và trình độ hiện tại của bạn.' },
      { icon: 'Award', title: 'Kỹ năng hướng dẫn chỉ có tại Thắng Tin Học', desc: 'Cách truyền đạt dễ hiểu, kiên nhẫn, thực chiến — giúp người mới bắt đầu thành thạo thật sự, không chỉ “học cho có”.' },
    ];
  }

  let testimonials = [];
  try { testimonials = JSON.parse(settings?.home_testimonials || '[]'); } catch (e) { testimonials = []; }
  if (testimonials.length === 0) {
    testimonials = [
      { name: 'Phạm Thị Lan', role: 'Kế Toán Viên', text: 'Học 1 kèm 1 với thầy Thắng giúp tôi tăng tốc Excel lên rõ rệt. Thầy giảng rất tận tâm và dễ hiểu!', rating: 5, avatar: '' },
      { name: 'Nguyễn Văn Hùng', role: 'Nhân Viên Văn Phòng', text: 'Ban đầu tôi sợ máy tính. Nhờ học online kèm riêng, giờ tôi tự tin Word và PowerPoint trong công việc.', rating: 5, avatar: '' },
      { name: 'Trần Thanh Mai', role: 'Quản Lý Dự Án', text: 'Cách hướng dẫn thực chiến và sửa bài trực tiếp trên máy tôi — đúng thứ tôi cần. Rất đáng để bắt đầu.', rating: 5, avatar: '' },
    ];
  }

  const stats = [
    { value: '5,000+', label: 'Học Viên', icon: Users },
    { value: '50+', label: 'Khóa Học', icon: BookOpen },
    { value: '98%', label: 'Hài Lòng', icon: Award },
    { value: '10+', label: 'Năm Kinh Nghiệm', icon: TrendingUp },
  ];

  const learningPath = [
    { step: '01', title: 'Nhắn Zalo tư vấn', desc: 'Gửi tin nhắn, nói rõ mục tiêu học (Excel, Word, tin học văn phòng…)', icon: MessageSquare },
    { step: '02', title: 'Tư vấn lộ trình', desc: 'Được gợi ý lịch học và nội dung phù hợp trình độ của bạn', icon: Target },
    { step: '03', title: 'Học 1 kèm 1 online', desc: 'Học trực tiếp với thầy qua UltraViewer — sửa bài ngay trên máy bạn', icon: Monitor },
    { step: '04', title: 'Thành thạo kỹ năng', desc: 'Áp dụng được vào công việc thực tế, tự tin hơn mỗi ngày', icon: GraduationCap },
  ];

  const partnersList = [
    { name: 'FPT Corporation', logo: '/logo_fpt.webp' },
    { name: 'Viettel', logo: '/logo_viettel.webp' },
    { name: 'VinGroup', logo: '/logo_vingroup.webp' },
    { name: 'VNPT', logo: '/logo_vnpt.webp' },
    { name: 'Samsung Vietnam', logo: '/logo_samsung.webp' },
    { name: 'MISA', logo: '/logo_misa.webp' },
  ];

  let dynamicPartners = [];
  try { dynamicPartners = JSON.parse(settings?.home_partners || '[]'); } catch (e) { /* empty */ }
  const finalPartners = dynamicPartners.length > 0 ? dynamicPartners : partnersList;

  let customSections = {};
  try { customSections = JSON.parse(settings?.custom_sections || '{}'); } catch (e) { /* empty */ }

  const SECTION_DOM_MAP = {
    hero: 'hero',
    stats: 'stats-banner',
    features: 'features-section',
    mos: 'mos-section',
    'learning-path': 'learning-path',
    'visual-learning': 'visual-learning',
    courses: 'courses-section',
    testimonials: 'testimonials',
    partners: 'partners',
    cta: 'cta-section',
  };
  sectionOrder.forEach(id => { if (id.startsWith('container-')) SECTION_DOM_MAP[id] = id; });

  const visibleSections = sectionOrder.filter(id => !sectionVisibility[id]);
  sectionIdsRef.current = visibleSections.map(id => SECTION_DOM_MAP[id]).filter(Boolean);

  const sectionRenderers = {
    hero: () => (
      <section className="hero" id="hero" key="hero">
        <div className="hero-bg">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-orb orb3" />
          <div className="hero-grid" />
          <div className="hero-noise" />
        </div>
        <div className="container hero-content">
          <ScrollReveal animation={anim.hero} duration={1000} className="hero-text">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Tuyển sinh · Học online 1 kèm 1</span>
            </div>
            <p className="hero-brand">Thắng Tin Học</p>
            <h1 className="hero-title">
              {settings?.hero_title ? (
                settings.hero_title.split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)
              ) : (
                <>Học tin học online <span className="highlight-ai">1 kèm 1</span><br />Cách hướng dẫn chỉ có tại đây</>
              )}
            </h1>
            <p className="hero-desc">
              {settings?.hero_subtitle
                || 'Không học đại trà. Thầy Thắng kèm riêng từng học viên — sửa bài trực tiếp trên máy bạn qua UltraViewer. Cam kết hiểu và làm được, không chỉ “nghe cho xong”.'}
            </p>
            <div className="hero-actions">
              <ZaloConsultButton href={zaloHref} className="hero-cta">
                {settings?.hero_btn_text || 'Đăng ký tư vấn Zalo'}
              </ZaloConsultButton>
              <Link to="/gioi-thieu" className="btn btn-ghost btn-lg">
                Giới thiệu Thắng Tin Học <ChevronRight size={18} />
              </Link>
            </div>
            <div className="hero-trust">
              <div className="hero-avatars">
                {['P', 'N', 'T', 'H'].map((l, i) => (
                  <div key={i} className="hero-avatar-circle">{l}</div>
                ))}
              </div>
              <div className="hero-trust-text">
                <div className="hero-trust-stars">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <span>Hàng nghìn học viên đã bắt đầu từ một tin nhắn Zalo</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation={anim.hero} delay={300} duration={1000} className="hero-visual-premium">
            <div className="visual-wrapper">
              {settings?.hero_media_url && (settings.hero_media_url.includes('youtube') || settings.hero_media_url.includes('youtu.be')) ? (
                <div className="main-3d-character" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <YoutubeFacade url={settings.hero_media_url} title="Hero Video" />
                </div>
              ) : settings?.hero_media_url && settings?.hero_media_type === 'video' ? (
                <div className="main-3d-character" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <VideoPlayer src={settings.hero_media_url} />
                </div>
              ) : (
                <div className="main-3d-character">
                  <img
                    src={settings?.hero_media_url || '/hero-banner.webp'}
                    alt="Học tin học online 1 kèm 1 tại Thắng Tin Học"
                    width="400"
                    height="340"
                    sizes="(max-width: 768px) 90vw, 400px"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              )}
              <div className="floating-3d word-3d float-slow">
                <img src="/word_icon_3d.webp" alt="Word" width="72" height="72" loading="lazy" decoding="async" />
                <div className="tool-glow word-glow" />
              </div>
              <div className="floating-3d excel-3d float-reverse">
                <img src="/excel_icon_3d.webp" alt="Excel" width="72" height="72" loading="lazy" decoding="async" />
                <div className="tool-glow excel-glow" />
              </div>
              <div className="floating-3d ppt-3d float-mid">
                <img src="/ppt_icon_3d.webp" alt="PowerPoint" width="72" height="72" loading="lazy" decoding="async" />
                <div className="tool-glow ppt-glow" />
              </div>
              <div className="hero-glass-card stats-card float-slow">
                <Users size={16} color="var(--primary-light)" />
                <span>Học 1 kèm 1 · Online toàn quốc</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    ),

    stats: () => (
      <section className="stats-banner" id="stats-banner" key="stats">
        <div className="container">
          <StaggerReveal animation={anim.stats} staggerDelay={120} className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon-wrap"><s.icon size={24} /></div>
                <div className="stat-info">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>
    ),

    features: () => (
      <section className="section-padding features-section" id="features-section" key="features">
        <div className="container">
          <ScrollReveal animation={anim.features} className="section-center">
            <div className="section-tag"><Award size={14} /> Vì Sao Chọn Thắng Tin Học?</div>
            <h2 className="section-title">
              Cách hướng dẫn <span className="highlight">chỉ có tại đây</span>
            </h2>
            <p className="section-subtitle">
              Không phải lớp đông. Là kèm riêng — kiên nhẫn, thực chiến, giúp bạn thành thạo thật sự.
            </p>
          </ScrollReveal>
          <StaggerReveal animation={anim.features} staggerDelay={150} className="grid-4 features-grid">
            {features.map((f, i) => {
              const Icon = IconMap[f.icon] || CheckCircle;
              return (
                <div key={i} className="feature-card-premium usp-card" style={{ '--accent': '#dc2626' }}>
                  <div className="feature-icon-wrapper usp-icon-wrap">
                    <div className="feature-icon-fallback"><Icon size={28} /></div>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <div className="feature-border" />
                </div>
              );
            })}
          </StaggerReveal>
        </div>
      </section>
    ),

    mos: () => (
      <section className="section-padding mos-section" id="mos-section" key="mos">
        <div className="container">
          <div className="mos-layout">
            <ScrollReveal animation={anim.features} className="mos-copy">
              <div className="section-tag"><Trophy size={14} /> Chứng chỉ Microsoft</div>
              <h2 className="section-title">
                Đăng ký học &amp; luyện thi <span className="highlight">MOS</span>
              </h2>
              <p className="section-subtitle mos-lead">
                Luyện Word, Excel, PowerPoint theo chuẩn Microsoft Office Specialist —
                kèm 1 kèm 1, luyện đề bằng phần mềm <strong>GMetrix</strong>, thi đúng cấu trúc hiện tại.
              </p>
              <ul className="mos-points">
                {[
                  'Học MOS Word / Excel / PowerPoint (Office 2019 & Microsoft 365)',
                  'Luyện thi trên GMetrix — môi trường gần đề thật, chấm tự động',
                  'Nắm cấu trúc thi thực hành: làm task/dự án trong ~50 phút/môn',
                  'Giảng viên theo sát đến khi bạn tự tin dự thi',
                  'Lịch học linh hoạt · online toàn quốc qua UltraViewer',
                  'Hỗ trợ cả lộ trình IC3 Digital Literacy nếu cần',
                ].map((t) => (
                  <li key={t}><CheckCircle size={18} /> <span>{t}</span></li>
                ))}
              </ul>
              <div className="mos-actions">
                <Link to="/?enroll=hoc" className="btn btn-primary btn-lg">
                  Đăng ký học MOS <ArrowRight size={18} />
                </Link>
                <Link to="/?enroll=thi" className="btn btn-ghost btn-lg">
                  Đăng ký thi
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fade-left" delay={120} className="mos-aside">
              {settings?.mos_image ? (
                <div className="mos-aside-media">
                  <img
                    src={settings.mos_image}
                    alt={settings.mos_image_alt || 'Luyện thi chứng chỉ MOS — Thắng Tin Học'}
                    loading="lazy"
                    decoding="async"
                  />
                  <Link to="https://www.thangtinhoc.edu.vn/blog/cau-truc-de-thi-mos" className="mos-aside-link mos-aside-media-link">
                    Chi tiết dịch vụ MOS <ChevronRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="mos-badge-card">
                  <div className="mos-badge-row">
                    <span className="mos-pill">MOS Word</span>
                    <span className="mos-pill">MOS Excel</span>
                    <span className="mos-pill">MOS PowerPoint</span>
                  </div>
                  <div className="mos-aside-stat">
                    <Award size={28} />
                    <div>
                      <strong>GMetrix Practice</strong>
                      <p>Luyện đề · làm quen giao diện · sẵn sàng trước ngày thi</p>
                    </div>
                  </div>
                  <Link to="https://www.thangtinhoc.edu.vn/blog/cau-truc-de-thi-mos" className="mos-aside-link">
                    Chi tiết dịch vụ MOS <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>
    ),

    'learning-path': () => (
      <section className="section-padding learning-path-section" id="learning-path" key="learning-path">
        <div className="container">
          <ScrollReveal animation={anim.learningPath} className="section-center">
            <div className="section-tag"><Target size={14} /> Quy Trình Tuyển Sinh</div>
            <h2 className="section-title">Bắt đầu chỉ với <span className="highlight">4 bước</span></h2>
            <p className="section-subtitle">Từ một tin nhắn Zalo đến buổi học 1 kèm 1 đầu tiên</p>
          </ScrollReveal>
          <StaggerReveal animation={anim.learningPath} staggerDelay={200} className="path-grid">
            {learningPath.map((item, i) => (
              <div key={i} className="path-card">
                <div className="path-step">{item.step}</div>
                <div className="path-icon"><item.icon size={28} /></div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                {i < learningPath.length - 1 && <div className="path-connector" />}
              </div>
            ))}
          </StaggerReveal>
          <div className="path-cta">
            <ZaloConsultButton href={zaloHref}>Nhắn Zalo ngay</ZaloConsultButton>
          </div>
        </div>
      </section>
    ),

    'visual-learning': () => (
      <section className="section-padding visual-learning-section" id="visual-learning" key="visual-learning">
        <div className="container visual-grid">
          <ScrollReveal animation="fade-right" className="visual-image">
            <div className="visual-wrapper">
              {settings?.visual_media_url ? (
                (settings?.visual_media_type === 'video') ? (
                  <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    {settings.visual_media_url.includes('youtube') || settings.visual_media_url.includes('youtu.be') ? (
                      <YoutubeFacade url={settings.visual_media_url} title="Visual Learning Video" />
                    ) : (
                      <VideoPlayer src={settings.visual_media_url} />
                    )}
                  </div>
                ) : (
                  <img src={settings.visual_media_url} alt="Visual Learning" />
                )
              ) : (
                <img src="/computer_usage_3d.webp" alt="Computer Skills" width="560" height="400" loading="lazy" decoding="async" />
              )}
              <div className="visual-glow-ai" />
            </div>
          </ScrollReveal>
          <ScrollReveal animation={anim.visual === 'fade-right' ? 'fade-left' : anim.visual} delay={200} className="visual-content">
            <div className="section-tag section-tag-ai">
              {settings?.visual_subtitle || 'Học online qua UltraViewer'}
            </div>
            <h2 className="section-title text-left">
              {settings?.visual_title || <>Học trực tiếp trên <span className="highlight-ai">máy của bạn</span></>}
            </h2>
            <p className="v-desc">
              {settings?.visual_description || 'Thầy hướng dẫn và sửa bài ngay trên máy tính của bạn — hiệu quả như ngồi cạnh nhau, học từ mọi nơi.'}
            </p>
            <ZaloConsultButton href={zaloHref} className="visual-zalo-cta">
              Tư vấn lịch học Zalo
            </ZaloConsultButton>
          </ScrollReveal>
        </div>
      </section>
    ),

    courses: () => (
      <section className="section-padding courses-section" id="courses-section" key="courses">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="section-header">
              <div>
                <div className="section-tag"><BookOpen size={14} /> {settings?.courses_tag || 'Khóa Học Nổi Bật'}</div>
                <h2 className="section-title">{settings?.courses_title || <>Khóa Học <span className="highlight">Được Yêu Thích</span></>}</h2>
                <p className="section-subtitle">{settings?.courses_subtitle || 'Chọn từ hàng chục khóa học chất lượng cao được thiết kế bởi chuyên gia hàng đầu'}</p>
              </div>
              <Link to="/courses" className="btn btn-outline">
                {settings?.courses_btn_text || 'Xem Tất Cả'} <ChevronRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          {loading ? (
            <div className="loader loader--section"><div className="spinner" /></div>
          ) : (
            <StaggerReveal animation="fade-up" staggerDelay={150} className="grid-3">
              {featuredCourses.map((course, i) => (
                <CourseCard key={course.id} course={course} priority={i < 2} />
              ))}
            </StaggerReveal>
          )}
        </div>
      </section>
    ),

    testimonials: () => (
      <section className="section-padding testimonials-section" id="testimonials" key="testimonials">
        <div className="container">
          <ScrollReveal animation={anim.testimonials} className="section-center">
            <div className="section-tag"><MessageSquare size={14} /> Học Viên Nói Gì?</div>
            <h2 className="section-title">Phản hồi <span className="highlight">thực tế</span> từ học viên 1 kèm 1</h2>
            <p className="section-subtitle">Những người đã bắt đầu bằng một tin nhắn tư vấn — và thay đổi cách làm việc mỗi ngày</p>
          </ScrollReveal>
          <StaggerReveal animation={anim.testimonials} staggerDelay={200} className="grid-3 testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-quote"><Quote size={28} /></div>
                <div className="testimonial-stars stars">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} fill={s <= t.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                  ))}
                </div>
                <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
                <div className="testimonial-author">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="author-avatar-img" width="48" height="48" loading="lazy" decoding="async" />
                  ) : (
                    <div className="author-avatar">{t.name?.[0] || '?'}</div>
                  )}
                  <div>
                    <p className="author-name">{t.name}</p>
                    <p className="author-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>
    ),

    partners: () => (
      <section className="section-padding partners-section" id="partners" key="partners">
        <div className="container">
          <ScrollReveal animation={anim.partners} className="section-center">
            <div className="section-tag"><Zap size={14} /> Đối Tác Chiến Lược</div>
            <h2 className="section-title">Đồng Hành Cùng <span className="highlight">Sự Thành Công</span></h2>
            <p className="section-subtitle">Chúng tôi hợp tác với các tập đoàn công nghệ và trường đại học hàng đầu</p>
          </ScrollReveal>
          <StaggerReveal animation={anim.partners} staggerDelay={100} className="partners-grid">
            {finalPartners.map((partner, i) => (
              <div key={i} className="partner-card">
                <img src={partner.logo} alt={partner.name} title={partner.name} width="140" height="56" loading="lazy" decoding="async" />
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>
    ),

    cta: () => (
      <section className="cta-section" id="cta-section" key="cta">
        <div className="cta-bg">
          <div className="cta-orb cta-orb1" />
          <div className="cta-orb cta-orb2" />
        </div>
        <ScrollReveal animation={anim.cta} className="container cta-content">
          <div className="cta-badge"><Sparkles size={14} /> Sẵn sàng bắt đầu?</div>
          <h2 className="cta-title">
            {settings?.cta_title || <>Nhắn Zalo để được<br /><span>tư vấn lộ trình 1 kèm 1</span></>}
          </h2>
          <p className="cta-desc">
            {settings?.cta_subtitle || <>Miễn phí tư vấn — nói rõ mục tiêu học, nhận gợi ý lịch và nội dung phù hợp.<br />Chỉ một tin nhắn để bắt đầu.</>}
          </p>
          <div className="cta-actions">
            <ZaloConsultButton href={zaloHref} className="cta-btn">
              {settings?.cta_btn_text || 'Đăng ký tư vấn Zalo'}
            </ZaloConsultButton>
            <Link to={settings?.cta_btn2_url || '/gioi-thieu'} className="btn btn-ghost btn-lg">
              {settings?.cta_btn2_text || 'Về Thắng Tin Học'} <ChevronRight size={18} />
            </Link>
          </div>
        </ScrollReveal>
      </section>
    ),
  };

  return (
    <div className="home">
      {visibleSections.map(sectionId => {
        const renderer = sectionRenderers[sectionId];
        if (renderer) return renderer();
        if (sectionId.startsWith('container-') && customSections[sectionId]) {
          const cs = customSections[sectionId];
          return (
            <section key={sectionId} id={sectionId} className="section-padding" style={{ background: cs.bgColor || '#fff5f5' }}>
              <div className="container">
                <ScrollReveal animation="fade-up" className="section-center">
                  <h2 className="section-title">{cs.title}</h2>
                </ScrollReveal>
                <ScrollReveal animation="fade-up" delay={150}>
                  <div style={{ display: 'grid', gridTemplateColumns: cs.layout || '1fr 1fr', gap: '24px' }}>
                    {(cs.items || []).map((item, i) => (
                      <div key={i} className="home-custom-card">
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{item.icon || '📌'}</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{item.title}</h3>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                        {item.btnText && (
                          <Link to={item.btnUrl || '#'} className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                            {item.btnText} <ArrowRight size={16} />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </div>
            </section>
          );
        }
        return null;
      })}

      {showPromo && createPortal(
        <div className="promo-overlay" role="dialog" aria-modal="true" aria-label="Ưu đãi" onClick={() => { setShowPromo(false); sessionStorage.setItem('promo_dismissed', '1'); }}>
          <div className="promo-popup" onClick={e => e.stopPropagation()}>
            <button type="button" className="promo-close" aria-label="Đóng" onClick={() => { setShowPromo(false); sessionStorage.setItem('promo_dismissed', '1'); }}>✕</button>
            {(settings?.promo_image || settings?.promo_enabled === 'true') ? (
              <Link
                to={settings?.promo_link || '/lien-he'}
                onClick={() => { setShowPromo(false); sessionStorage.setItem('promo_dismissed', '1'); }}
              >
                <img
                  src={settings?.promo_image || '/promo-popup-1kem1.png'}
                  alt={settings.promo_title || 'Khuyến mãi'}
                  className="promo-image"
                  width="1200"
                  height="800"
                  loading="eager"
                  decoding="async"
                />
              </Link>
            ) : (
              <div className="promo-html-content">
                {settings?.promo_title && <h3 className="promo-title">{settings.promo_title}</h3>}
                {settings?.promo_text && (
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(settings.promo_text) }} />
                )}
                {settings?.promo_link && (
                  <Link
                    to={settings.promo_link}
                    className="btn btn-primary"
                    style={{ marginTop: '16px', display: 'inline-flex' }}
                    onClick={() => { setShowPromo(false); sessionStorage.setItem('promo_dismissed', '1'); }}
                  >
                    Xem ngay
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <button
        type="button"
        className={`section-navigator ${showNav ? 'visible' : ''} ${isLastSection ? 'go-top' : ''}`}
        onClick={handleNavClick}
        aria-label={isLastSection ? 'Cuộn lên đầu trang' : 'Cuộn xuống phần tiếp'}
      >
        {isLastSection ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
      </button>
    </div>
  );
}
