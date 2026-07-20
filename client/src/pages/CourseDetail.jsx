import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Users, Clock, BookOpen, CheckCircle, Play, ShoppingCart, Lock, X, ArrowRight, Link2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { getYoutubeId } from '../lib/youtube';
import {
  usePageSeo,
  SITE_URL,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildPersonSchema,
} from '../lib/usePageSeo';
import './CourseDetail.css';

function formatPrice(price) {
  return price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [related, setRelated] = useState([]); // related courses
  const [enrolling, setEnrolling] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [progress, setProgress] = useState([]);
  const [activeTab, setActiveTab] = useState('content');
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get(`/courses/${slug}`).then(res => {
      setCourse(res.data.data);
    }).catch(() => navigate('/courses')).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated && course) {
      api.get(`/courses/${course.id}/enrollment`).then(res => {
        setEnrolled(res.data.data?.enrolled || false);
        if (res.data.data?.enrollment?.progress) {
          setProgress(res.data.data.enrollment.progress.filter(p => p.completed).map(p => p.lessonId));
        }
      }).catch(() => setEnrolled(false));
    }
  }, [course, isAuthenticated]);

  // Fetch related courses
  useEffect(() => {
    if (course?.id) {
      api.get(`/courses/${course.id}/related`).then(res => {
        setRelated(res.data.data || []);
      }).catch(() => setRelated([]));
    }
  }, [course?.id]);

  // Fetch featured courses
  useEffect(() => {
    api.get('/courses?featured=true&limit=4').then(res => {
      setFeatured((res.data.data || []).filter(c => c.slug !== slug).slice(0, 4));
    }).catch(() => { });
  }, [slug]);

  const pageSeo = useMemo(() => {
    if (!course) return { enabled: false };
    const plain = stripHtml(course.shortDescription || course.description || course.title);
    const description = (plain || `Khóa học ${course.title} tại Thắng Tin Học — học online 1 kèm 1.`).slice(0, 160);
    const canonical = `${SITE_URL}/courses/${course.slug}`;
    const image = course.thumbnail?.startsWith('http')
      ? course.thumbnail
      : (course.thumbnail ? `${SITE_URL}${course.thumbnail}` : `${SITE_URL}/hero-banner.png`);

    const courseSchema = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description,
      url: canonical,
      image,
      provider: {
        '@type': 'Organization',
        name: 'Thắng Tin Học',
        url: SITE_URL,
      },
      offers: {
        '@type': 'Offer',
        url: canonical,
        price: Number(course.price) || 0,
        priceCurrency: 'VND',
        availability: 'https://schema.org/InStock',
        category: course.price === 0 ? 'Free' : 'Paid',
      },
      ...(course.level ? { educationalLevel: course.level } : {}),
    };

    return {
      enabled: true,
      title: course.title,
      description,
      keywords: [course.title, course.category?.name, 'khóa học tin học', 'Thắng Tin Học', 'học online 1 kèm 1']
        .filter(Boolean)
        .join(', '),
      canonical,
      image,
      type: 'website',
      schemas: [
        buildBreadcrumbSchema([
          { name: 'Trang chủ', url: '/' },
          { name: 'Khóa học', url: '/courses' },
          { name: course.title, url: `/courses/${course.slug}` },
        ]),
        courseSchema,
        buildOrganizationSchema(),
        buildPersonSchema(),
      ],
    };
  }, [course]);

  usePageSeo(pageSeo);

  const handleEnroll = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (course.price === 0) {
      setEnrolling(true);
      try {
        await api.post('/orders', { courseIds: [course.id], paymentMethod: 'free' });
        setEnrolled(true);
        toast.success('Đăng ký khóa học thành công!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
      } finally { setEnrolling(false); }
    } else {
      navigate('/checkout', { state: { courses: [course] } });
    }
  };

  const handleStartLearning = () => {
    // Navigate to the first lesson or first incomplete lesson
    if (course?.lessons?.length > 0) {
      const firstIncomplete = course.lessons.find(l => !progress.includes(l.id));
      const target = firstIncomplete || course.lessons[0];
      navigate(`/learn/${slug}/${target.id}`);
    }
  };

  const openPreview = (lesson) => {
    if (lesson.isPreview && lesson.videoUrl) {
      setPreviewVideo({ title: lesson.title, videoUrl: lesson.videoUrl });
    }
  };

  if (loading) return <div className="loader loader--page"><div className="spinner" /></div>;
  if (!course) return null;

  const discount = course.originalPrice && course.originalPrice > course.price
    ? Math.round((1 - course.price / course.originalPrice) * 100) : null;

  // Find the first preview lesson with video for the hero area
  const firstPreview = course.lessons?.find(l => l.isPreview && l.videoUrl);
  const heroVideoId = getYoutubeId(firstPreview?.videoUrl);

  const hasProgress = progress.length > 0;
  const progressPercent = course.lessons?.length > 0 ? Math.round((progress.length / course.lessons.length) * 100) : 0;

  return (
    <div className="course-detail">
      {/* Hero */}
      <div className="cd-hero">
        <div className="cd-hero-bg" />
        <div className="container cd-hero-content">
          <div className="cd-info">
            <span className="badge badge-primary">{course.category?.name}</span>
            <h1 className="cd-title">{course.title}</h1>
            <p className="cd-desc">{course.description}</p>

            <div className="cd-meta">
              <div className="cd-rating">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={16} fill={i <= Math.round(course.avgRating || 0) ? '#f59e0b' : 'none'} color="#f59e0b" />
                  ))}
                </div>
                <span>{course.avgRating || '0.0'}</span>
                <span className="text-muted">({course.reviewCount || 0} đánh giá)</span>
              </div>
              <span className="cd-stat"><Users size={15} /> {course.totalStudents || 0} học viên</span>
              <span className="cd-stat"><Clock size={15} /> {course.totalDuration || course.duration || '0 phút'}</span>
              <span className="cd-stat"><BookOpen size={15} /> {course.totalLessons || course.lessons?.length || 0} bài học</span>
            </div>

            {/* Video Preview Area */}
            <div className="cd-video-preview">
              {heroVideoId ? (
                <div className="cd-video-wrapper">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${heroVideoId}?rel=0`}
                    title="Preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : course.thumbnail ? (
                <div className="cd-video-wrapper cd-thumb-hero">
                  <img src={course.thumbnail} alt={course.title} />
                  {firstPreview && (
                    <button className="cd-play-overlay" onClick={() => openPreview(firstPreview)}>
                      <Play size={48} fill="#fff" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="cd-video-wrapper cd-no-video">
                  <Play size={48} />
                  <p>Video giới thiệu sẽ sớm được cập nhật</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Card */}
          <div className="cd-sidebar">
            <div className="cd-purchase-card">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="cd-thumbnail" />
              ) : (
                <div className="cd-thumbnail-placeholder"><BookOpen size={60} /></div>
              )}
              <div className="cd-purchase-body">
                <div className="cd-price-row">
                  <span className="price">{formatPrice(course.price)}</span>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <>
                      <span className="price-original">{formatPrice(course.originalPrice)}</span>
                      {discount && <span className="price-discount">-{discount}%</span>}
                    </>
                  )}
                </div>

                {enrolled ? (
                  <div className="cd-enrolled-actions">
                    {hasProgress && (
                      <div className="cd-progress-bar">
                        <div className="cd-progress-fill" style={{ width: `${progressPercent}%` }} />
                        <span className="cd-progress-text">{progressPercent}% hoàn thành</span>
                      </div>
                    )}
                    <button className="btn btn-primary cd-learn-btn" onClick={handleStartLearning}>
                      <ArrowRight size={18} />
                      {hasProgress ? 'Tiếp Tục Học' : 'Vào Học Ngay'}
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleEnroll} disabled={enrolling}>
                    <ShoppingCart size={18} />
                    {enrolling ? 'Đang xử lý...' : course.price === 0 ? 'Đăng Ký Miễn Phí' : 'Đăng Ký Ngay'}
                  </button>
                )}

                <div className="cd-includes">
                  <p className="cd-includes-title">Khóa học bao gồm:</p>
                  <ul>
                    <li><CheckCircle size={14} /> Bài học video: <strong>{course.videoLessons || course.lessons?.filter(l => l.videoUrl)?.length || 0}</strong></li>
                    <li><CheckCircle size={14} /> Thời lượng: <strong>{course.totalDuration || course.duration || '0 phút'}</strong></li>
                    {(course.hasDocuments !== false) && <li><CheckCircle size={14} /> Tài liệu đính kèm: <strong>Có</strong></li>}
                    {(course.hasLifetimeAccess !== false) && <li><CheckCircle size={14} /> Truy cập trọn đời: <strong>Có</strong></li>}
                    {(course.hasCertificate !== false) && <li><CheckCircle size={14} /> Chứng nhận hoàn thành: <strong>Có</strong></li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body - Tabs */}
      <div className="container cd-body">
        {/* Tab Navigation */}
        <div className="cd-tabs">
          {[
            { key: 'content', label: 'Nội Dung Khóa Học', icon: <BookOpen size={16} /> },
            { key: 'requirements', label: 'Yêu Cầu', icon: <CheckCircle size={16} /> },
            { key: 'description', label: 'Mô Tả', icon: <Star size={16} /> },
            { key: 'reviews', label: `Đánh Giá (${course.reviews?.length || 0})`, icon: <MessageSquare size={16} /> },
          ].map(tab => (
            <button
              key={tab.key}
              className={`cd-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="cd-tab-content">
          {/* Nội Dung Khóa Học */}
          {activeTab === 'content' && (
            <div className="cd-section animate-fade-in">
              <div className="cd-section-header">
                <h2>Nội Dung Khóa Học</h2>
                <span className="cd-lesson-count">{course.lessons?.length || 0} bài học · {course.totalDuration || course.duration || '0 phút'}</span>
              </div>
              <div className="lessons-list">
                {course.lessons?.map((lesson, i) => {
                  const canPreview = lesson.isPreview && lesson.videoUrl;
                  const isCompleted = progress.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      className={`lesson-item ${lesson.isPreview ? 'preview' : ''} ${canPreview ? 'clickable' : ''} ${isCompleted ? 'completed' : ''}`}
                      onClick={() => {
                        if (canPreview) openPreview(lesson);
                        else if (enrolled) navigate(`/learn/${slug}/${lesson.id}`);
                      }}
                    >
                      <div className="lesson-left">
                        <span className={`lesson-num ${isCompleted ? 'done' : ''}`}>
                          {isCompleted ? <CheckCircle size={12} /> : i + 1}
                        </span>
                        {lesson.isPreview ? <Play size={14} color="#10b981" /> : enrolled ? <Play size={14} color="#6366f1" /> : <Lock size={14} />}
                        <span className="lesson-title">{lesson.title}</span>
                        {!enrolled && lesson.isPreview && (
                          <span className="badge badge-success lesson-preview-badge">
                            <Play size={10} /> Xem thử
                          </span>
                        )}
                      </div>
                      <span className="lesson-duration">{lesson.duration} phút</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Yêu Cầu */}
          {activeTab === 'requirements' && (
            <div className="cd-section animate-fade-in">
              <h2>Yêu Cầu Khóa Học</h2>
              {(() => {
                let reqs = [];
                try { reqs = JSON.parse(course.requirements || '[]'); } catch { reqs = []; }
                return reqs.length > 0 ? (
                  <ul className="cd-requirements-list">
                    {reqs.map((r, i) => (
                      <li key={i}><CheckCircle size={15} color="#10b981" /> <span>{r}</span></li>
                    ))}
                  </ul>
                ) : (
                  <div className="cd-empty-state">
                    <CheckCircle size={40} />
                    <p>Không có yêu cầu đặc biệt. Bạn có thể bắt đầu ngay!</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Mô Tả */}
          {activeTab === 'description' && (
            <div className="cd-section animate-fade-in">
              <h2>Mô Tả Chi Tiết</h2>
              {(() => {
                const text = course.content || course.description || '';
                const lines = text.split('\n').filter(l => l.trim());
                return lines.length > 0 ? (
                  <ul className="cd-description-list">
                    {lines.map((line, i) => (
                      <li key={i}><span className="cd-bullet">•</span> <span>{line.trim()}</span></li>
                    ))}
                  </ul>
                ) : (
                  <div className="cd-empty-state">
                    <BookOpen size={40} />
                    <p>Chưa có mô tả chi tiết cho khóa học này.</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Đánh Giá */}
          {activeTab === 'reviews' && (
            <div className="cd-section animate-fade-in">
              <h2>Đánh Giá Từ Học Viên</h2>
              {course.reviews?.length > 0 ? (
                <div className="reviews-list">
                  {course.reviews.map(review => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <div className="review-avatar">{review.user?.fullName?.[0] || 'U'}</div>
                        <div>
                          <p className="review-name">{review.user?.fullName}</p>
                          <div className="stars">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={13} fill={i <= review.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="review-comment">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cd-empty-state">
                  <MessageSquare size={40} />
                  <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá khóa học!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Khóa học nổi bật */}
        {(related.length > 0 || featured.length > 0) && (
          <div className="cd-section cd-featured-section">
            <h2>🔥 Khóa Học Nổi Bật</h2>
            <div className="cd-featured-grid">
              {(related.length > 0 ? related : featured).slice(0, 4).map(rc => (
                <Link to={`/courses/${rc.slug}`} key={rc.id} className="cd-featured-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="cd-featured-img">
                    {rc.thumbnail ? (
                      <img src={rc.thumbnail} alt={rc.title} />
                    ) : (
                      <div className="cd-featured-placeholder"><BookOpen size={32} /></div>
                    )}
                    {rc.price === 0 && <span className="cd-featured-badge">Miễn phí</span>}
                  </div>
                  <div className="cd-featured-body">
                    <span className="cd-featured-cat">{rc.category?.name}</span>
                    <h4>{rc.title}</h4>
                    <div className="cd-featured-meta">
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={11} fill={i <= Math.round(rc.avgRating || 0) ? '#f59e0b' : 'none'} color="#f59e0b" />
                        ))}
                        <span>{rc.avgRating || '0.0'}</span>
                      </div>
                      <span className="cd-featured-price">{formatPrice(rc.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="cd-modal-overlay" onClick={() => setPreviewVideo(null)}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-header">
              <h3><Play size={16} /> {previewVideo.title}</h3>
              <button onClick={() => setPreviewVideo(null)}><X size={20} /></button>
            </div>
            <div className="cd-modal-video">
              {getYoutubeId(previewVideo.videoUrl) ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${getYoutubeId(previewVideo.videoUrl)}?autoplay=1&rel=0`}
                  title={previewVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={previewVideo.videoUrl} controls autoPlay style={{ width: '100%' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
