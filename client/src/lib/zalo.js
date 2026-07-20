/**
 * Lấy link chat Zalo — ưu tiên URL của nút Zalo nổi (social_buttons.show_chat),
 * sau đó settings.zalo_url, cuối cùng /lien-he.
 */
export function getZaloChatUrl(settings) {
  try {
    const buttons = JSON.parse(settings?.social_buttons || '[]');
    const fromChat = buttons.find(
      (b) => b.icon === 'zalo' && b.show_chat && String(b.url || '').trim(),
    );
    if (fromChat?.url) return String(fromChat.url).trim();
    const anyZalo = buttons.find((b) => b.icon === 'zalo' && String(b.url || '').trim());
    if (anyZalo?.url) return String(anyZalo.url).trim();
  } catch {
    /* ignore */
  }
  const direct = String(settings?.zalo_url || '').trim();
  if (direct) return direct;
  return '/lien-he';
}

export function isExternalHref(href) {
  return /^(https?:)?\/\//i.test(href) || /^zalo:/i.test(href);
}
