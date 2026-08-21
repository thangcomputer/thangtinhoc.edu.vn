/**
 * articleValidator.js — SEO Article Skill v1.0
 * Validate va sanitize JSON response tu Gemini truoc khi tra ve frontend.
 *
 * Chuc nang:
 * - detectPromptInjection(topic): phat hien tan cong prompt injection tu input nguoi dung
 * - sanitizeHtml(html): loai script/event/h1/data:URL, chi giu tags an toan
 * - validateArticle(raw, topic): validate + normalize object AI tra ve
 * - slugifyFallback(text): tao slug tu title neu AI tra sai
 * - countWords(html): dem tu trong HTML
 */

// ─── Tags HTML duoc phep (whitelist) ─────────────────────────────────────
const ALLOWED_TAGS = new Set([
  'p','h2','h3','h4','strong','em','b','i','u','s','del','ins',
  'ul','ol','li','blockquote','code','pre','br','hr',
  'table','thead','tbody','tfoot','tr','th','td','caption',
  'figure','figcaption','img','a',
  'sup','sub','mark','small',
]);

// Attributes duoc phep theo tag
const ALLOWED_ATTRS = {
  a: ['href','title','target','rel'],
  img: ['src','alt','title','width','height','loading'],
  td: ['colspan','rowspan'],
  th: ['colspan','rowspan','scope'],
  table: ['class'],
  blockquote: ['cite'],
  code: ['class'],
  pre: ['class'],
};

// ─── Prompt injection detection patterns ─────────────────────────────────
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+instructions?/i,
  /forget\s+your\s+(instructions?|training|rules?)/i,
  /you\s+are\s+now\s+a/i,
  /new\s+instructions?:/i,
  /system\s*:\s*ignore/i,
  /reveal\s+(your\s+)?(prompt|instructions?|system)/i,
  /print\s+(your\s+)?(prompt|instructions?)/i,
  /bypass\s+(your\s+)?(filter|safety|restriction)/i,
  /DAN\s+mode/i,
  /jailbreak/i,
];

/**
 * Phat hien prompt injection trong topic nguoi dung nhap.
 * Neu phat hien, tu choi xu ly va tra loi loi.
 * @param {string} topic
 * @returns {boolean}
 */
function detectPromptInjection(topic) {
  const t = String(topic || '');
  return INJECTION_PATTERNS.some((r) => r.test(t));
}

/**
 * Sanitize mot tag HTML don le: chi giu tagName + attrs duoc phep.
 * @param {string} tagStr
 * @returns {string}
 */
function sanitizeTag(tagStr) {
  const tagMatch = tagStr.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
  if (!tagMatch) return '';
  const tagName = tagMatch[1].toLowerCase();
  const isClose = tagStr.startsWith('</');
  if (!ALLOWED_TAGS.has(tagName)) return '';
  if (isClose) return '</' + tagName + '>';
  const allowedAttrs = ALLOWED_ATTRS[tagName] || [];
  let attrs = '';
  for (const attr of allowedAttrs) {
    const m = tagStr.match(new RegExp(attr + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]*))', 'i'));
    if (!m) continue;
    let val = (m[1] != null ? m[1] : m[2] != null ? m[2] : m[3] != null ? m[3] : '').trim();
    if (!val) continue;
    if ((attr === 'href' || attr === 'src') && /^\s*javascript:/i.test(val)) continue;
    if ((attr === 'href' || attr === 'src') && /^\s*data:/i.test(val)) continue;
    if (attr === 'target' && val === '_blank') {
      attrs += ' target="_blank" rel="noopener noreferrer"';
      continue;
    }
    val = val.replace(/"/g, '&quot;');
    attrs += ' ' + attr + '="' + val + '"';
  }
  const selfClose = ['img', 'br', 'hr'].includes(tagName) ? ' /' : '';
  return '<' + tagName + attrs + selfClose + '>';
}

/**
 * Sanitize HTML string:
 * - Xoa script, style, iframe, noscript
 * - Xoa comments HTML
 * - Xoa event attributes (onclick, onerror, v.v.)
 * - Xoa data: URLs trong src/href
 * - Chi giu tags/attrs trong whitelist
 * - Xoa the <h1> (frontend tu render tieu de)
 * @param {string} html
 * @returns {string}
 */
function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/(src|href)\s*=\s*"data:[^"]*"/gi, '')
    .replace(/(src|href)\s*=\s*'data:[^']*'/gi, '')
    .replace(/<[^>]+>/g, function(tag) { return sanitizeTag(tag); })
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Tao slug an toan tu text (dung khi AI tra slug sai/trong).
 * @param {string} text
 * @returns {string}
 */
function slugifyFallback(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

/**
 * Kiem tra slug hop le (chi lowercase a-z, 0-9, dau -).
 * @param {string} slug
 * @returns {boolean}
 */
function isValidSlug(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(slug || ''));
}

/**
 * Dem so tu trong HTML/text.
 * @param {string} html
 * @returns {number}
 */
function countWords(html) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(/\s+/).length : 0;
}

/**
 * Validate va normalize object article tu AI.
 *
 * Xu ly:
 * - title: fallback neu trong, cat neu qua dai
 * - slug: kiem tra + tu sinh tu title neu sai
 * - excerpt: xoa HTML, cat dai
 * - content: sanitize HTML, xoa h1
 * - focusKeyword, metaTitle, metaDescription: normalize + cat
 * - tags: loc + them brand tags
 * - suggestions: normalize internal link objects
 *
 * @param {object} raw - Object raw tu JSON.parse(AI response)
 * @param {string} topic - Chu de goc nguoi dung nhap (de fallback)
 * @returns {{ valid: boolean, data: object|null, warnings: string[] }}
 */
function validateArticle(raw, topic) {
  var t = topic || '';
  var warnings = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, data: null, warnings: ['Ket qua AI khong phai object hop le'] };
  }

  // ── title ──────────────────────────────────────────────────────────────
  var title = String(raw.title || raw.tieuDe || '').trim();
  if (!title) {
    title = 'Bai viet ve ' + (t || 'chu de nay');
    warnings.push('AI khong tao duoc title -- dung fallback');
  }
  if (title.length > 120) {
    title = title.substring(0, 120);
    warnings.push('Title qua dai (>120 ky tu) -- da cat bot');
  }

  // ── slug ──────────────────────────────────────────────────────────────
  var slug = String(raw.slug || '').trim().toLowerCase();
  if (!slug || !isValidSlug(slug)) {
    slug = slugifyFallback(title);
    if (slug) warnings.push('Slug AI khong hop le -- tu tao tu title');
  }
  slug = slug.substring(0, 80);

  // ── excerpt ───────────────────────────────────────────────────────────
  var excerpt = String(raw.excerpt || raw.summary || raw.tomTat || '').trim();
  excerpt = excerpt.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (excerpt.length > 300) {
    excerpt = excerpt.substring(0, 300);
    warnings.push('Excerpt qua dai -- cat bot 300');
  }

  // ── content ───────────────────────────────────────────────────────────
  var content = String(raw.content || raw.noiDung || raw.content_html || '').trim();
  if (!content) {
    return { valid: false, data: null, warnings: ['AI khong tao duoc noi dung (content trong)'] };
  }
  content = sanitizeHtml(content);
  var wordCount = countWords(content);
  if (wordCount < 150) {
    warnings.push('Noi dung qua ngan (' + wordCount + ' tu) -- AI co the bi loi quota');
  }

  // ── focusKeyword ──────────────────────────────────────────────────────
  var focusKeyword = String(
    raw.focusKeyword || raw.focus_keyword || raw.tuKhoaChinh || t || ''
  ).trim().substring(0, 100);

  // ── metaTitle (SEO Title) ─────────────────────────────────────────────
  var metaTitle = String(raw.metaTitle || raw.seo_title || raw.seoTitle || '').trim();
  if (!metaTitle) metaTitle = title.substring(0, 60);
  if (metaTitle.length > 70) {
    metaTitle = metaTitle.substring(0, 70);
    warnings.push('metaTitle > 70 ky tu -- cat bot');
  }

  // ── metaDescription ──────────────────────────────────────────────────
  var metaDescription = String(
    raw.metaDescription || raw.meta_description || raw.moTaSeo || ''
  ).trim().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!metaDescription) metaDescription = excerpt.substring(0, 160);
  if (metaDescription.length > 200) {
    metaDescription = metaDescription.substring(0, 200);
    warnings.push('metaDescription > 200 ky tu -- cat bot');
  }

  // ── tags ─────────────────────────────────────────────────────────────
  var tags = [];
  var rawTags = raw.tags || raw.theTag || [];
  if (Array.isArray(rawTags)) {
    tags = rawTags
      .filter(function(t2) { return t2 && typeof t2 === 'string'; })
      .map(function(t2) { return t2.trim().replace(/^#/, '').substring(0, 50); })
      .filter(Boolean)
      .slice(0, 10);
  }
  // Luon dam bao co brand tags co ban
  var BRAND_TAGS = ['thangcomputer', 'tinhocvanphong', 'hoctinhoc'];
  for (var i = 0; i < BRAND_TAGS.length; i++) {
    if (!tags.includes(BRAND_TAGS[i])) tags.push(BRAND_TAGS[i]);
  }
  tags = Array.from(new Set(tags)).slice(0, 10);

  // ── suggestions (internal links) ─────────────────────────────────────
  var suggestions = [];
  var rawSugg = raw.suggestions || raw.suggested_internal_links || raw.internalLinks || [];
  if (Array.isArray(rawSugg)) {
    suggestions = rawSugg
      .map(function(s) {
        if (typeof s === 'string') return { title: s.trim(), snippet: '' };
        if (s && typeof s === 'object') {
          return {
            title: String(s.title || s.anchor || s.text || '').trim().substring(0, 120),
            snippet: String(s.snippet || s.description || '').trim().substring(0, 200),
          };
        }
        return null;
      })
      .filter(function(s) { return s && s.title; })
      .slice(0, 8);
  }

  return {
    valid: true,
    warnings: warnings,
    data: {
      title: title,
      slug: slug,
      excerpt: excerpt,
      content: content,
      focusKeyword: focusKeyword,
      metaTitle: metaTitle,
      metaDescription: metaDescription,
      tags: tags,
      suggestions: suggestions,
      wordCount: wordCount,
    },
  };
}

module.exports = {
  detectPromptInjection: detectPromptInjection,
  sanitizeHtml: sanitizeHtml,
  validateArticle: validateArticle,
  slugifyFallback: slugifyFallback,
  countWords: countWords,
};
