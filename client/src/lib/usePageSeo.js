import { useEffect } from 'react';

const SITE_NAME = 'Thắng Tin Học';
const SITE_URL = 'https://thangtinhoc.edu.vn';
const DEFAULT_TITLE = `${SITE_NAME} - Trung Tâm Đào Tạo Tin Học Văn Phòng | thangtinhoc.edu.vn`;

function setMeta(attr, key, content) {
  if (content == null || content === '') return;
  const selector = attr === 'property'
    ? `meta[property="${key}"]`
    : `meta[name="${key}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

function injectSchemas(schemas) {
  document.querySelectorAll('script[data-seo-schema]').forEach((el) => el.remove());
  (schemas || []).forEach((schema, i) => {
    if (!schema) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-schema', `schema-${i}`);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
}

/**
 * Apply page-level SEO (title, meta, OG, Twitter, canonical, JSON-LD).
 * @param {object|null} seo
 * @param {string} [seo.title]
 * @param {string} [seo.description]
 * @param {string} [seo.keywords]
 * @param {string} [seo.canonical]
 * @param {string} [seo.image]
 * @param {string} [seo.type] - website | article
 * @param {boolean} [seo.noIndex]
 * @param {string} [seo.publishedTime]
 * @param {string} [seo.modifiedTime]
 * @param {string} [seo.section]
 * @param {object[]} [seo.schemas]
 * @param {boolean} [seo.enabled] - set false to skip (e.g. while loading)
 */
export function usePageSeo(seo) {
  useEffect(() => {
    if (!seo || seo.enabled === false) return undefined;

    const title = seo.title
      ? (seo.title.includes(SITE_NAME) ? seo.title : `${seo.title} | ${SITE_NAME}`)
      : DEFAULT_TITLE;
    const description = seo.description || '';
    const canonical = seo.canonical
      || (typeof window !== 'undefined' ? window.location.href.split('#')[0] : SITE_URL);
    const image = seo.image || `${SITE_URL}/hero-banner.png`;
    const type = seo.type || 'website';

    document.title = title;
    setMeta('name', 'description', description);
    if (seo.keywords) setMeta('name', 'keywords', seo.keywords);
    setMeta('name', 'robots', seo.noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', 'vi_VN');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);

    if (type === 'article') {
      if (seo.publishedTime) setMeta('property', 'article:published_time', seo.publishedTime);
      if (seo.modifiedTime) setMeta('property', 'article:modified_time', seo.modifiedTime);
      if (seo.section) setMeta('property', 'article:section', seo.section);
    }

    setCanonical(canonical);
    if (seo.schemas?.length) injectSchemas(seo.schemas);

    return () => {
      document.querySelectorAll('script[data-seo-schema]').forEach((el) => el.remove());
    };
  }, [
    seo?.enabled,
    seo?.title,
    seo?.description,
    seo?.keywords,
    seo?.canonical,
    seo?.image,
    seo?.type,
    seo?.noIndex,
    seo?.publishedTime,
    seo?.modifiedTime,
    seo?.section,
    // stringify schemas for stable dep
    seo?.schemas ? JSON.stringify(seo.schemas) : '',
  ]);
}

export function buildBreadcrumbSchema(items, baseUrl = SITE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

export function buildPersonSchema(baseUrl = SITE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Thắng Tin Học',
    alternateName: ['Thầy Thắng Tin Học', 'Thầy Thắng'],
    url: `${baseUrl}/gioi-thieu`,
    jobTitle: 'Giáo viên tin học văn phòng',
    description: 'Thắng Tin Học — giáo viên đào tạo tin học văn phòng, Excel, Word, PowerPoint online 1 kèm 1 qua UltraViewer.',
    knowsAbout: [
      'Tin học văn phòng',
      'Microsoft Excel',
      'Microsoft Word',
      'Microsoft PowerPoint',
      'Đào tạo online 1 kèm 1',
    ],
    worksFor: {
      '@type': 'Organization',
      name: 'Thắng Tin Học',
      url: baseUrl,
    },
  };
}

export function buildOrganizationSchema(baseUrl = SITE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Thắng Tin Học',
    url: baseUrl,
    logo: `${baseUrl}/logo.webp`,
    description: 'Trung tâm đào tạo tin học văn phòng — học Word, Excel, PowerPoint online 1 kèm 1.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'VN',
    },
  };
}

export { SITE_NAME, SITE_URL, DEFAULT_TITLE };
