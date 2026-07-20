import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Table, FileText, Presentation, Users, Monitor, Wifi, ArrowRight, CheckCircle,
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
    anchors: ['học online qua UltraViewer'],
  },
  {
    id: 'tu-xa',
    icon: Wifi,
    title: 'Học từ xa',
    desc: 'Học máy tính / máy vi tính online toàn quốc — có ghi hình buổi học và hỗ trợ sau khóa.',
    anchors: ['học máy tính từ xa', 'học máy vi tính online'],
  },
];

export default function Services() {
  const seo = useMemo(() => ({
    title: 'Dịch vụ đào tạo tin học văn phòng | Thắng Tin Học',
    description: 'Dịch vụ Thắng Tin Học: học tin học văn phòng, Excel, Word, PowerPoint, online 1 kèm 1, UltraViewer và học từ xa. Đăng ký lộ trình phù hợp ngay.',
    keywords: 'dịch vụ tin học, khóa học tin học văn phòng, học Excel online, học Word online, dạy Excel 1 kèm 1, UltraViewer, học máy tính từ xa, Thắng Tin Học',
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
              Từ học máy tính cho người mới đến Excel nâng cao — học online, học từ xa,
              1 kèm 1 qua UltraViewer cùng <Link to="/gioi-thieu">Thầy Thắng Tin Học</Link>.
            </p>
            <div className="services-hero-ctas">
              <Link to="/courses" className="btn btn-primary">Xem khóa học</Link>
              <Link to="/lien-he" className="btn btn-outline-light">Đăng ký tư vấn</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="services-list">
        <div className="container">
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <ScrollReveal key={s.id} animation="fade-up" delay={i * 50}>
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
                    <Link to="/courses">Khám phá khóa học <ArrowRight size={14} /></Link>
                    <Link to="/lien-he">Đăng ký học</Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
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
