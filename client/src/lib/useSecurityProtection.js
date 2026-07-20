import { useEffect } from 'react';

/** Chặn chuột phải / F12 / View Source — chỉ bật ở production. Local được xem code tự do. */
export function useSecurityProtection() {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    const blockContext = (e) => e.preventDefault();
    const blockKeys = (e) => {
      if (e.key === 'F12') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key)) e.preventDefault();
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) e.preventDefault();
      if (e.metaKey && e.altKey && e.key === 'i') e.preventDefault();
    };

    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('keydown', blockKeys);

    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
    };
  }, []);
}