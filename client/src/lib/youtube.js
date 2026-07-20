/**
 * Build a privacy-enhanced YouTube embed URL (youtube-nocookie.com).
 * Reduces third-party cookie warnings in Lighthouse / Chrome Issues.
 */
export function getYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|v\/|watch\?v=|watch\?.+&v=)|youtube-nocookie\.com\/embed\/)([\w-]{11})/
  );
  return match ? match[1] : null;
}

export function toYoutubeEmbedUrl(url, params = {}) {
  const id = getYoutubeId(url);
  if (!id) {
    // Already an embed URL without parseable id — force nocookie host if possible
    if (typeof url === 'string' && url.includes('youtube.com/embed/')) {
      return url.replace('www.youtube.com', 'www.youtube-nocookie.com');
    }
    return url;
  }
  const qs = new URLSearchParams({ rel: '0', ...params }).toString();
  return `https://www.youtube-nocookie.com/embed/${id}?${qs}`;
}
