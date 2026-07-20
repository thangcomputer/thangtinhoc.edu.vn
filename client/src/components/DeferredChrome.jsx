import { useState, useEffect, lazy, Suspense } from 'react';

const PromotionPopup = lazy(() => import('./PromotionPopup'));
const ChatWidget = lazy(() => import('./ChatWidget'));
const CookieConsent = lazy(() => import('./CookieConsent'));

/** Mount non-critical chrome after first paint / idle — keeps mobile FCP/LCP cleaner. */
export default function DeferredChrome({ settings }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(enable, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const t = setTimeout(enable, 1200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <PromotionPopup enabled={settings?.promo_enabled} content={settings?.promo_text} />
      <ChatWidget settings={settings} />
      <CookieConsent />
    </Suspense>
  );
}
