import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Table, FileText, Presentation, Users, Monitor, Wifi, ArrowRight, CheckCircle,
  Award, Timer, Laptop,
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import SeoBreadcrumb from '../components/SeoBreadcrumb';
import {
  usePageSeo,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  SITE_URL,
} from '../lib/usePageSeo';
import './Services.css';

const SERVICES = [
  {
    id: 'tin-hoc-van-phong',
    icon: BookOpen,
    title: 'Học Tin học văn phòng',
    desc: 'Nền tảng thao tác Windows, quản lý file, Word – Excel – PowerPoint cơ bản cho công việc văn phòng.',
    anchors: ['tin học văn phòng', 'khóa học tin học văn phòng'],
  },
  {
    id: 'excel',
    icon: Table,
    title: 'Học Excel',
    desc: 'Từ hàm cơ bản, bảng tính đến Pivot, báo cáo — lộ trình Excel theo nghiệp vụ thực tế.',
    anchors: ['khóa học Excel', 'học Excel online'],
  },
  {
    id: 'word',
    icon: FileText,
    title: 'Học Word',
    desc: 'Soạn thảo văn bản chuyên nghiệp: định dạng, mục lục, thư hàng loạt, hợp đồng.',
    anchors: ['khóa học Word', 'học Word online'],
  },
  {
    id: 'powerpoint',
    icon: Presentation,
    title: 'Học PowerPoint',
    desc: 'Thiết kế slide thuyết trình rõ ràng, chuyên nghiệp cho học tập và công việc.',
    anchors: ['khóa học PowerPoint', 'mẹo dùng PowerPoint'],
  },
  {
    id: 'mos',
    icon: Award,
    title: 'Học / luyện thi MOS',
    desc: 'Luyện thi MOS Word, Excel, PowerPoint và IC3 — kèm GMetrix, lịch linh hoạt.',
    anchors: ['luyện thi MOS', 'học MOS Word Excel PowerPoint'],
    primaryCta: { to: '/?enroll=hoc', label: 'Đăng ký học MOS' },
    secondaryCta: { to: '/?enroll=thi', label: 'Đăng ký thi' },
  },
  {
    id: 'hoc-1-kem-1',
    icon: Users,
    title: 'Học Online 1 kèm 1',
    desc: 'Gia sư tin học riêng — lịch linh hoạt, sửa bài trực tiếp, tiến độ theo bạn.',
    anchors: ['dạy Excel 1 kèm 1', 'dạy Word 1 kèm 1', 'đăng ký học 1 kèm 1'],
  },
  {
    id: 'ultraviewer',
    icon: Monitor,
    title: 'Học qua UltraViewer',
    desc: 'Giáo viên điều khiển và hướng dẫn trên máy của bạn — hiệu quả như ngồi cạnh nhau.',
    anchors: ['học online qua UltraViewer', 'điều khiển máy từ xa'],
  },
  {
    id: 'tu-xa',
    icon: Wifi,
    title: 'Học từ xa',
    desc: 'Học máy tính / máy vi tính online toàn quốc — có ghi hình buổi học và hỗ trợ sau khóa.',
    anchors: ['học máy tính từ xa', 'học máy vi tính online'],
  },
];

const GMETRIX_POINTS = [
  'Làm quen giao diện đề gần với kỳ thi MOS thật',
  'Chấm tự động, luyện lại nhiều lần trước ngày thi',
  'Kết hợp hướng dẫn 1 kèm 1 đến khi vững tay nghề',
];

const MOS_STRUCTURE = [
  {
    icon: Laptop,
    title: 'Thi thực hành trên Office',
    text: 'Mỗi môn Word / Excel / PowerPoint: làm task / dự án trực tiếp trên ứng dụng Office theo đề.',
  },
  {
    icon: Timer,
    title: 'Thời gian ~50 phút / môn',
    text: 'Mỗi môn thường khoảng 50 phút; hoàn thành các yêu cầu theo đề trong thời gian quy định.',
  },
  {
    icon: Award,
    title: 'Điểm đạt theo chuẩn Microsoft',
    text: 'Ngưỡng đạt theo quy định kỳ thi / trung tâm tổ chức. Phiên bản phổ biến: Office 2019 / Microsoft 365.',
  },
];

export default function Services() {
  const seo = useMemo(() => ({
    title: 'Dịch vụ tin học, MOS & GMetrix | Thắng Tin Học',
    description:
      'Dịch vụ Thắng Tin Học: tin học văn phòng, Excel, Word, PowerPoint, luyện thi MOS, GMetrix, online 1 kèm 1 và học từ xa. Đăng ký lộ trình phù hợp ngay.',
    keywords:
      'dịch vụ tin học, khóa học tin học văn phòng, luyện thi MOS, học MOS, GMetrix, học Excel online, học Word online, dạy Excel 1 kèm 1, UltraViewer, học máy tính từ xa, Thắng Tin Học',
    canonical: `${SITE_URL}/dich-vu`,
    schemas: [
      buildOrganizationSchema(),
      buildBreadcrumbSchema([
        { name: 'Trang chủ', url: '/' },
        { name: 'Dịch vụ', url: '/dich-vu' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Dịch vụ đào tạo Thắng Tin Học',
        itemListElement: SERVICES.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: s.title,
          url: `${SITE_URL}/dich-vu#${s.id}`,
        })),
      },
    ],
  }), []);

  usePageSeo(seo);

  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="container">
          <SeoBreadcrumb items={[
            { name: 'Trang chủ', to: '/' },
            { name: 'Dịch vụ' },
          ]} />
          <ScrollReveal animation="fade-up">
            <p className="services-eyebrow">Thắng Tin Học</p>
            <h1>Dịch vụ đào tạo tin học văn phòng</h1>
            <p className="services-lead">
              Từ học máy tính cho người mới đến Excel nâng cao, luyện thi MOS với GMetrix —
              học online, học từ xa, 1 kèm 1 qua UltraViewer cùng{' '}
              <Link to="/gioi-thieu">Thầy Thắng Tin Học</Link>.
            </p>
            <div className="services-hero-ctas">
              <Link to="/?enroll=hoc" className="btn btn-primary">Đăng ký học MOS</Link>
              <Link to="/?enroll=thi" className="btn btn-outline-light">Đăng ký thi</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="services-list">
        <div className="container">
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <ScrollReveal key={s.id} animation="fade-up" delay={i * 50} className="service-card-wrap">
                <article className="service-card" id={s.id}>
                  <div className="service-icon"><s.icon size={24} /></div>
                  <h2>{s.title}</h2>
                  <p>{s.desc}</p>
                  <ul className="service-checks">
                    {s.anchors.slice(0, 2).map((a) => (
                      <li key={a}><CheckCircle size={14} /> {a}</li>
                    ))}
                  </ul>
                  <div className="service-actions">
                    {s.primaryCta ? (
                      <>
                        <Link to={s.primaryCta.to}>{s.primaryCta.label} <ArrowRight size={14} /></Link>
                        <Link to={s.secondaryCta?.to || '/lien-he'}>{s.secondaryCta?.label || 'Liên hệ'}</Link>
                      </>
                    ) : (
                      <>
                        <Link to="/courses">Khóa học video miễn phí</Link> |
                        <Link to="/lien-he">Đăng ký học 1 kèm 1</Link>
                      </>
                    )}
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="services-gmetrix" id="gmetrix">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="gmetrix-panel">
              <p className="services-eyebrow">Luyện đề chính thức</p>
              <h2>GMetrix &amp; cấu trúc thi MOS hiện tại</h2>
              <p className="gmetrix-lead">
                <strong>GMetrix</strong> là phần mềm luyện thi theo môi trường gần đề MOS —
                giúp bạn làm quen giao diện, thao tác và áp lực thời gian trước ngày thi thật.
              </p>

              <div className="gmetrix-benefits">
                {GMETRIX_POINTS.map((p) => (
                  <div key={p} className="gmetrix-benefit">
                    <CheckCircle size={16} />
                    <span>{p}</span>
                  </div>
                ))}
              </div>

              <h3 className="gmetrix-subhead">Cấu trúc thi MOS (tóm tắt)</h3>
              <div className="mos-structure-grid">
                {MOS_STRUCTURE.map((item) => (
                  <div key={item.title} className="mos-structure-card">
                    <div className="mos-structure-icon"><item.icon size={20} /></div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="services-hero-ctas gmetrix-ctas">
                <Link to="/?enroll=thi" className="btn btn-primary">Đăng ký thi MOS</Link>
                <Link to="/?enroll=hoc" className="btn btn-outline-light">Đăng ký học MOS</Link>
                <Link to="/lien-he" className="btn btn-outline-light">Liên hệ / Zalo tư vấn</Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="services-cta">
        <div className="container">
          <div className="services-cta-box">
            <h2>Sẵn sàng học cùng Thắng Tin Học?</h2>
            <p>
              Tìm hiểu thêm về <Link to="/gioi-thieu">Thầy Thắng Tin Học</Link>,
              đọc <Link to="/blog">blog tin học văn phòng</Link>,
              hoặc gửi đăng ký ngay.
            </p>
            <div className="services-hero-ctas">
              <Link to="/gioi-thieu" className="btn btn-primary">Giới thiệu Thắng Tin Học</Link>
              <Link to="/lien-he" className="btn btn-outline-light">Liên hệ đăng ký</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
