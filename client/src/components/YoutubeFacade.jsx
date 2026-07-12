import { useState } from 'react';
import { Play } from 'lucide-react';
import { toYoutubeEmbedUrl, getYoutubeId } from '../lib/youtube';
import './YoutubeFacade.css';

/**
 * Privacy-friendly YouTube embed: no iframe (no cookies) until the user clicks play.
 * Improves Lighthouse Best Practices / third-party cookie audits.
 */
export default function YoutubeFacade({ url, title = 'Video', className = '' }) {
  const [active, setActive] = useState(false);
  const id = getYoutubeId(url);
  if (!id) return null;

  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const embed = toYoutubeEmbedUrl(url, { autoplay: '1' });

  if (active) {
    return (
      <div className={`yt-facade yt-facade--active ${className}`.trim()}>
        <iframe
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`yt-facade ${className}`.trim()}
      onClick={() => setActive(true)}
      aria-label={`Phát video: ${title}`}
    >
      <img src={thumb} alt="" width="480" height="360" loading="lazy" decoding="async" />
      <span className="yt-facade-play" aria-hidden="true">
        <Play size={28} fill="currentColor" />
      </span>
    </button>
  );
}
