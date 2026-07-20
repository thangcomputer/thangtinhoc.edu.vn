import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Eye, ArrowLeft, Tag, List, ChevronRight, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { sanitizeHTML } from '../lib/sanitize';
import { usePageSeo, SITE_URL } from '../lib/usePageSeo';
import SeoBreadcrumb from '../components/SeoBreadcrumb';
import InternalLinks from '../components/InternalLinks';
import './BlogDetail.css';

function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

function readingTime(html) {
  const words = (html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function parseTOC(post) {
  try {
    const stored = JSON.parse(post.tableOfContents || '[]');
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch { /* ignore */ }

  const toc = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(post.content || '', 'text/html');
  doc.querySelectorAll('h2, h3, h4').forEach((el) => {
    const level = parseInt(el.tagName[1], 10);
    const text = el.textContent.trim();
    const id = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    toc.push({ id, text, level });
  });
  return toc;
}

function processContent(html) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('h2, h3, h4').forEach((el) => {
    const text = el.textContent.trim();
    const id = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    el.id = id;
  });

  doc.querySelectorAll('img').forEach((img) => {
    if (img.closest('figure')) return;
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    const alt = img.getAttribute('alt') || '';
    const figure = doc.createElement('figure');
    figure.className = 'bd-figure';
    img.parentNode.insertBefore(figure, img);
    figure.appendChild(img);
    if (alt && alt !== img.getAttribute('src')) {
      const caption = doc.createElement('figcaption');
      caption.textContent = alt;
      figure.appendChild(caption);
    }
  });

  return sanitizeHTML(doc.body.innerHTML);
}

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState('');
  const [tocOpen, setTocOpen] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setPost(null);
    setRelated([]);
    setSchemas([]);
    api.get(`/posts/${slug}`)
      .then((res) => {
        const p = res.data.data;
        setPost(p);

        api.get(`/seo/post/${slug}`).then((seoRes) => {
          setSchemas(seoRes.data?.data?.schemas || []);
        }).catch(() => {});

        if (p?.category?.id) {
          api.get(`/posts?categoryId=${p.category.id}&limit=6`)
            .then((r) => {
              const others = (r.data.data || []).filter((x) => x.slug !== slug).slice(0, 6);
              setRelated(others);
            }).catch(() => {});
        }
      })
      .catch((err) => {
        setPost(null);
        const msg = err.response?.data?.message;
        const hint = err.code === 'ERR_NETWORK'
          ? 'Chưa chạy API — mở terminal: cd server && npm run dev'
          : (msg || `Lỗi ${err.response?.status || 'kết nối'}`);
        toast.error(`Không tải được bài viết. ${hint}`);
      })
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

  const seo = useMemo(() => {
    if (!post) return { enabled: false };
    let tags = [];
    try { tags = JSON.parse(post.tags || '[]'); } catch { tags = []; }
    const canonical = (post.canonicalUrl && String(post.canonicalUrl).trim())
      || `${SITE_URL}/blog/${post.slug}`;
    return {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      keywords: Array.isArray(tags) ? tags.join(', ') : '',
      canonical,
      image: post.thumbnail || undefined,
      type: 'article',
      noIndex: !!post.noIndex,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      section: post.category?.name || '',
      schemas,
    };
  }, [post, schemas]);

  usePageSeo(seo);

  useEffect(() => {
    if (!post) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-10% 0px -75% 0px' },
    );
    const headings = contentRef.current?.querySelectorAll('h2, h3, h4') || [];
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [post]);

  if (loading) return <div className="loader loader--page"><div className="spinner" /></div>;
  if (!post) return <div style={{ padding: '10rem', textAlign: 'center' }}>Không tìm thấy bài viết</div>;

  const toc = parseTOC(post);
  const processedContent = processContent(post.content);
  const mins = readingTime(post.content);

  return (
    <div className="blog-detail">
      <div className="bd-hero">
        <div className="bd-hero-bg" />
        <div className="container">
          <div className="bd-shell bd-hero-inner">
            <SeoBreadcrumb items={[
              { name: 'Trang chủ', to: '/' },
              { name: 'Blog', to: '/blog' },
              { name: post.title },
            ]} />
            <div className="bd-hero-actions">
              <Link to="/blog" className="btn btn-ghost btn-sm bd-back">
                <ArrowLeft size={16} /> Quay Lại Blog
              </Link>
              {post.category?.name && (
                <span className="badge badge-primary"><Tag size={12} /> {post.category.name}</span>
              )}
            </div>
            <h1 className="bd-title">{post.title}</h1>
            <div className="bd-meta">
              <div className="bd-author">
                <div className="author-avatar-sm">{post.author?.fullName?.[0] || 'T'}</div>
                <span>
                  <Link to="/gioi-thieu" className="bd-author-link">
                    {post.author?.fullName || 'Thắng Tin Học'}
                  </Link>
                </span>
              </div>
              <span><Clock size={14} />{timeAgo(post.createdAt)} · {mins} phút đọc</span>
              <span><Eye size={14} />{post.views} lượt xem</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container bd-body">
        <div className={`bd-shell bd-layout${toc.length === 0 ? ' bd-layout--solo' : ''}`}>
        {toc.length > 0 && (
          <aside className="bd-toc-sidebar">
            <div className="bd-toc-box">
              <button type="button" className="bd-toc-toggle" onClick={() => setTocOpen((v) => !v)}>
                <List size={16} />
                <span>Mục Lục</span>
                <ChevronRight size={14} style={{ transform: tocOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
              </button>
              {tocOpen && (
                <nav className="bd-toc-nav">
                  {toc.map((item, i) => (
                    <a
                      key={i}
                      href={`#${item.id}`}
                      className={`bd-toc-item bd-toc-h${item.level}${activeId === item.id ? ' active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </aside>
        )}

        <main className="bd-main">
          {post.thumbnail && (
            <div className="bd-featured-img">
              <img src={post.thumbnail} alt={post.title} loading="eager" decoding="async" />
            </div>
          )}

          {toc.length > 0 && (
            <div className="bd-toc-inline">
              <div className="bd-toc-inline-header"><List size={15} /> Mục Lục Bài Viết</div>
              <ol className="bd-toc-inline-list">
                {toc.filter((t) => t.level === 2).map((item, i) => (
                  <li key={i}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div
            className="bd-content"
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          <InternalLinks seed={post.slug} title="Tìm hiểu thêm về Thắng Tin Học" />

          {post.tags && (() => {
            try {
              const tags = JSON.parse(post.tags);
              if (Array.isArray(tags) && tags.length > 0) {
                return (
                  <div className="bd-tags">
                    {tags.map((t, i) => (
                      <Link key={i} to={`/blog?tag=${encodeURIComponent(t)}`} className="bd-tag">#{t}</Link>
                    ))}
                  </div>
                );
              }
            } catch { /* ignore */ }
            return null;
          })()}

          {related.length > 0 && (
            <section className="bd-related">
              <h2 className="bd-related-title">
                <BookOpen size={20} /> Bài Viết Liên Quan
              </h2>
              <div className="bd-related-grid">
                {related.filter((r) => r.slug).map((r) => (
                  <Link key={r.id} to={`/blog/${r.slug}`} className="bd-related-card">
                    <div className="bd-related-thumb">
                      {r.thumbnail
                        ? <img src={r.thumbnail} alt={r.title} loading="lazy" decoding="async" />
                        : <div className="bd-related-thumb-placeholder"><BookOpen size={28} /></div>}
                      {r.category && <span className="bd-related-cat">{r.category.name}</span>}
                    </div>
                    <div className="bd-related-info">
                      <h3>{r.title}</h3>
                      <p>{r.excerpt}</p>
                      <span className="bd-related-date"><Clock size={11} /> {timeAgo(r.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="bd-cta bd-cta-box">
            <h2>Học tin học cùng Thắng Tin Học</h2>
            <p>
              Muốn học Excel, Word hoặc tin học văn phòng 1 kèm 1?
              Đăng ký lộ trình với <Link to="/gioi-thieu">Thầy Thắng Tin Học</Link>
              {' '}hoặc xem <Link to="/dich-vu">dịch vụ đào tạo</Link>.
            </p>
            <div className="bd-cta-actions">
              <Link to="/lien-he" className="btn btn-primary">Đăng ký học 1 kèm 1</Link>
              <Link to="/courses" className="btn btn-ghost">Xem khóa học</Link>
            </div>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
