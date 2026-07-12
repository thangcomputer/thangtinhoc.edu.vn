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

// Map filename cũ (localhost upload) -> static asset trong client/public
const STATIC_ASSET_MAP = {
  '1783489055872-n0g4bm1xmxi.png': '/courses/word.webp',
  '1783489004838-334txnplmau.png':  '/courses/excel.webp',
  '1783489161250-53frxuza427.png':  '/courses/excel-vba.webp',
  '1783489084614-ifxy59cu4jg.png':  '/courses/powerpoint.webp',
  '1783489219438-ukqzz7196x.png':   '/courses/van-phong.webp',
  '1783489182570-3wmm3vmnju9.png':  '/courses/google-workspace.webp',
  '1783488620365-0lgf5heawm9b.png': '/logo.webp',
  '1783488514111-7lhtv2y11j8.png':  '/hero-banner.webp',
};

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
    const uploadPath = localMatch[1]; // /uploads/filename.png
    const filename = uploadPath.split('/').pop();
    // Neu co static asset tuong ung, tra ve static path thay vi /uploads/
    if (STATIC_ASSET_MAP[filename]) return STATIC_ASSET_MAP[filename];
    return base ? `${base}${uploadPath}` : uploadPath;
  }

  if (trimmed.startsWith('/uploads/')) {
    const filename = trimmed.split('/').pop();
    if (STATIC_ASSET_MAP[filename]) return STATIC_ASSET_MAP[filename];
    return base ? `${base}${trimmed}` : trimmed;
  }

  try {
    const u = new URL(trimmed);
    if (u.pathname.startsWith('/uploads/')) {
      const filename = u.pathname.split('/').pop();
      if (STATIC_ASSET_MAP[filename]) return STATIC_ASSET_MAP[filename];
      return base ? `${base}${u.pathname}` : u.pathname;
    }
  } catch {
    /* not absolute URL */
  }

  // Prefer WebP for known static assets
  if (/^\/(logo|hero-banner)\.png$/i.test(trimmed) || /^\/courses\/[^/]+\.png$/i.test(trimmed)) {
    return trimmed.replace(/\.png$/i, '.webp');
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