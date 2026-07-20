const express = require('express');
const prisma = require('../lib/db');
const router = express.Router();

function siteBase(req) {
  return process.env.SITE_URL
    || req.query.domain
    || `${req.protocol}://${req.get('host')}`;
}

function personSchema(baseUrl) {
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

function organizationSchema(baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Thắng Tin Học',
    url: baseUrl,
    logo: `${baseUrl}/logo.webp`,
    description: 'Trung tâm đào tạo tin học văn phòng — học Word, Excel, PowerPoint online 1 kèm 1.',
  };
}

const PAGE_META = {
  home: {
    title: 'Thắng Tin Học - Trung Tâm Đào Tạo Tin Học Văn Phòng',
    description: 'Thắng Tin Học — đào tạo tin học văn phòng, Excel, Word, PowerPoint online 1 kèm 1 qua UltraViewer.',
    path: '/',
  },
  about: {
    title: 'Thắng Tin Học là ai? | Thầy Thắng Tin Học',
    description: 'Giới thiệu Thắng Tin Học — giáo viên đào tạo tin học văn phòng online 1 kèm 1.',
    path: '/gioi-thieu',
  },
  services: {
    title: 'Dịch vụ đào tạo tin học văn phòng | Thắng Tin Học',
    description: 'Dịch vụ: tin học văn phòng, Excel, Word, PowerPoint, học 1 kèm 1, UltraViewer, học từ xa.',
    path: '/dich-vu',
  },
  courses: {
    title: 'Khóa học tin học văn phòng | Thắng Tin Học',
    description: 'Danh sách khóa học Word, Excel, PowerPoint của Thắng Tin Học.',
    path: '/courses',
  },
  blog: {
    title: 'Blog tin học văn phòng | Thắng Tin Học',
    description: 'Bài viết hướng dẫn học máy tính, Excel, Word, PowerPoint.',
    path: '/blog',
  },
  contact: {
    title: 'Liên hệ đăng ký học | Thắng Tin Học',
    description: 'Liên hệ Thắng Tin Học để đăng ký học tin học văn phòng 1 kèm 1.',
    path: '/lien-he',
  },
};

// ═══════════════════════════════════════════════════════
// GET /sitemap.xml
// ═══════════════════════════════════════════════════════
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = siteBase(req);

    const [posts, courses] = await Promise.all([
      prisma.post.findMany({
        where: { isPublished: true, noIndex: false },
        select: { slug: true, updatedAt: true, createdAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.course.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url><loc>${baseUrl}/gioi-thieu</loc><changefreq>weekly</changefreq><priority>0.95</priority></url>
  <url><loc>${baseUrl}/dich-vu</loc><changefreq>weekly</changefreq><priority>0.95</priority></url>
  <url><loc>${baseUrl}/courses</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/blog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/lien-he</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/tuyen-dung</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>

${posts.map((p) => `  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <lastmod>${(p.updatedAt || p.createdAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

${courses.map((c) => `  <url>
    <loc>${baseUrl}/courses/${c.slug}</loc>
    <lastmod>${c.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// ═══════════════════════════════════════════════════════
// GET /robots.txt
// ═══════════════════════════════════════════════════════
router.get('/robots.txt', (req, res) => {
  const baseUrl = siteBase(req);
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /profile
Disallow: /checkout
Disallow: /my-courses
Disallow: /my-activity
Disallow: /learn/

Sitemap: ${baseUrl}/sitemap.xml
`);
});

// ═══════════════════════════════════════════════════════
// GET /api/seo/page/:key — meta + schema for static pages
// ═══════════════════════════════════════════════════════
router.get('/api/seo/page/:key', (req, res) => {
  const key = String(req.params.key || '').toLowerCase();
  const page = PAGE_META[key];
  if (!page) {
    return res.status(404).json({ success: false, message: 'Unknown page key' });
  }
  const baseUrl = siteBase(req);
  const url = `${baseUrl}${page.path}`;
  const schemas = [organizationSchema(baseUrl)];
  if (key === 'home' || key === 'about') schemas.push(personSchema(baseUrl));
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: baseUrl },
      ...(page.path !== '/'
        ? [{ '@type': 'ListItem', position: 2, name: page.title, item: url }]
        : []),
    ],
  });

  res.json({
    success: true,
    data: {
      meta: {
        title: page.title,
        description: page.description,
        url,
        canonical: url,
        type: 'website',
      },
      schemas,
    },
  });
});

// ═══════════════════════════════════════════════════════
// GET /api/seo/post/:slug
// ═══════════════════════════════════════════════════════
router.get('/api/seo/post/:slug', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        author: { select: { fullName: true, avatar: true } },
      },
    });

    if (!post) return res.status(404).json({ success: false });

    const baseUrl = siteBase(req);
    const postUrl = (post.canonicalUrl && String(post.canonicalUrl).trim())
      || `${baseUrl}/blog/${post.slug}`;

    const faqItems = [];
    const content = post.content || '';
    const qaRegex = /<h3[^>]*>(.*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi;
    let match;
    while ((match = qaRegex.exec(content)) !== null) {
      const q = match[1].replace(/<[^>]*>/g, '').trim();
      const a = match[2].replace(/<[^>]*>/g, '').trim();
      if (q && a && (q.includes('?') || /gì|sao|nào|không|có/i.test(q))) {
        faqItems.push({ question: q, answer: a });
      }
    }

    const authorName = post.author?.fullName || 'Thắng Tin Học';

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      image: post.thumbnail ? [post.thumbnail] : [`${baseUrl}/hero-banner.png`],
      datePublished: post.createdAt?.toISOString(),
      dateModified: post.updatedAt?.toISOString(),
      author: {
        '@type': 'Person',
        name: authorName,
        url: `${baseUrl}/gioi-thieu`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Thắng Tin Học',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.webp`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': postUrl,
      },
      wordCount: content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length,
      articleSection: post.category?.name || 'Tin Học',
      keywords: (() => {
        try { return JSON.parse(post.tags || '[]').join(', '); } catch { return ''; }
      })(),
    };

    let faqSchema = null;
    if (faqItems.length >= 2) {
      faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: 'Giới thiệu Thắng Tin Học', item: `${baseUrl}/gioi-thieu` },
        { '@type': 'ListItem', position: 4, name: post.title, item: postUrl },
      ],
    };

    const meta = {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      image: post.thumbnail || '',
      url: postUrl,
      noIndex: !!post.noIndex,
      canonical: postUrl,
      type: 'article',
      author: authorName,
      publishedTime: post.createdAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      category: post.category?.name || '',
      tags: (() => { try { return JSON.parse(post.tags || '[]'); } catch { return []; } })(),
    };

    res.json({
      success: true,
      data: {
        meta,
        schemas: [
          articleSchema,
          breadcrumbSchema,
          personSchema(baseUrl),
          organizationSchema(baseUrl),
          ...(faqSchema ? [faqSchema] : []),
        ],
      },
    });
  } catch (err) {
    console.error('SEO schema error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
