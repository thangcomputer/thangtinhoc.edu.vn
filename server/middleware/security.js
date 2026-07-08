/**
 * Security Middleware — Tin học 24h
 * Rate Limiting, Input Sanitization, HTTPS Redirect, Audit Logging
 */
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// ============================================================
// 1. RATE LIMITING — Chống brute-force & DDoS
// ============================================================

/** Global: max 500 requests / 15 phút per IP */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.' },
  skip: () => process.env.NODE_ENV === 'development',
});

/** Auth routes: max 20 login/register / 15 phút per IP */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút.' },
  skip: () => process.env.NODE_ENV === 'development',
});

/** Tạo limiter riêng theo loại form — tránh dùng chung quota giữa contact / ghi danh / tuyển dụng */
function makeFormLimiter({ name, max = 10, windowMs = 15 * 60 * 1000, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development',
    skipFailedRequests: true,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip || 'unknown')}:${name}`,
    message: message || { success: false, message: 'Bạn đã gửi quá nhiều lần, vui lòng thử lại sau.' },
  });
}

/** Liên hệ / tư vấn */
const contactFormLimiter = makeFormLimiter({
  name: 'contact',
  max: 10,
  message: { success: false, message: 'Bạn đã gửi quá nhiều tin nhắn, vui lòng thử lại sau 15 phút.' },
});

/** Ghi danh học / thi — quota riêng, thoáng hơn cho người dùng thật */
const registrationFormLimiter = makeFormLimiter({
  name: 'registration',
  max: 30,
  windowMs: 60 * 60 * 1000,
  message: {
    success: false,
    message: 'Bạn đã gửi quá nhiều đăng ký trong 1 giờ. Vui lòng gọi hotline hoặc thử lại sau.',
  },
});

/** Tuyển dụng giáo viên */
const recruitmentFormLimiter = makeFormLimiter({
  name: 'recruitment',
  max: 10,
  message: { success: false, message: 'Bạn đã gửi quá nhiều đơn, vui lòng thử lại sau 15 phút.' },
});

/** Chỉ giới hạn POST (form công khai) — GET admin không bị 429 */
function limitPostOnly(limiter) {
  return (req, res, next) => {
    if (req.method !== 'POST') return next();
    return limiter(req, res, next);
  };
}

/** @deprecated — dùng contactFormLimiter / registrationFormLimiter / recruitmentFormLimiter */
const formLimiter = contactFormLimiter;

/** Upload: max 50 uploads / 15 phút */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Quá nhiều file upload, vui lòng thử lại sau.' },
  skip: () => process.env.NODE_ENV === 'development',
});

// ============================================================
// 2. INPUT SANITIZATION — Chống XSS injection vào DB
// ============================================================
/** Trường lưu HTML (Quill/editor) — không escape &lt; &gt; (sẽ làm blog hiện raw HTML) */
const RICH_HTML_KEYS = new Set(['content', 'requirements']);

const stripDangerousHtml = (str) =>
  str
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '');

const sanitizeInput = (obj, parentKey = '') => {
  if (typeof obj === 'string') {
    if (RICH_HTML_KEYS.has(parentKey)) return stripDangerousHtml(obj);
    return stripDangerousHtml(obj)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  if (Array.isArray(obj)) return obj.map((item) => sanitizeInput(item, parentKey));
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(val, key);
    }
    return sanitized;
  }
  return obj;
};

const sanitizeMiddleware = (req, res, next) => {
  // Không sanitize file upload
  if (req.is('multipart/form-data')) return next();
  
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
};

// ============================================================
// 3. HTTPS REDIRECT — Bắt buộc HTTPS khi deploy production
// ============================================================
const httpsRedirect = (req, res, next) => {
  // Bỏ qua HTTPS redirect vì aaPanel đã tự động force HTTPS, 
  // và aaPanel reverse proxy không pass đúng header khiến host bị nhận nhầm thành 127.0.0.1
  next();
};

// ============================================================
// 4. SECURITY HEADERS — Bổ sung thêm trên Helmet
// ============================================================
const extraSecurityHeaders = (req, res, next) => {
  // Cấm cache cho API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// ============================================================
// 5. AUDIT LOG — Ghi log login cho bảo mật
// ============================================================
const auditLog = (action) => (req, res, next) => {
  const originalSend = res.json;
  res.json = function (body) {
    if (body?.success) {
      console.log(`[AUDIT] ${new Date().toISOString()} | ${action} | IP: ${req.ip} | ${req.body?.email || 'N/A'}`);
    } else {
      console.warn(`[AUDIT-FAIL] ${new Date().toISOString()} | ${action} FAILED | IP: ${req.ip} | ${req.body?.email || 'N/A'}`);
    }
    return originalSend.call(this, body);
  };
  next();
};

module.exports = {
  globalLimiter,
  authLimiter,
  limitPostOnly,
  formLimiter,
  contactFormLimiter,
  registrationFormLimiter,
  recruitmentFormLimiter,
  uploadLimiter,
  sanitizeMiddleware,
  httpsRedirect,
  extraSecurityHeaders,
  auditLog,
};
