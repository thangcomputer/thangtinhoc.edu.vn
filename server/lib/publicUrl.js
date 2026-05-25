/**
 * URL file public — uu tien SITE_URL hoac duong dan tuong doi /uploads/
 */
function siteBase() {
  return (process.env.SITE_URL || '').replace(/\/+$/, '');
}

function buildPublicFileUrl(filename) {
  const base = siteBase();
  const path = `/uploads/${filename}`;
  return base ? `${base}${path}` : path;
}

/** Sua URL localhost/127.0.0.1 da luu trong DB thanh /uploads/... hoac SITE_URL */
function normalizePublicUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return url;

  const base = siteBase();

  const localMatch = trimmed.match(
    /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(\/uploads\/[^\s?#]+)/i
  );
  if (localMatch) {
    return base ? `${base}${localMatch[1]}` : localMatch[1];
  }

  if (trimmed.startsWith('/uploads/')) {
    return base ? `${base}${trimmed}` : trimmed;
  }

  try {
    const u = new URL(trimmed);
    if (u.pathname.startsWith('/uploads/')) {
      return base ? `${base}${u.pathname}` : u.pathname;
    }
  } catch {
    /* not absolute URL */
  }

  return trimmed;
}

function normalizePostMedia(post) {
  if (!post || typeof post !== 'object') return post;
  const out = { ...post };
  if (out.thumbnail) out.thumbnail = normalizePublicUrl(out.thumbnail);
  return out;
}

module.exports = {
  siteBase,
  buildPublicFileUrl,
  normalizePublicUrl,
  normalizePostMedia,
};