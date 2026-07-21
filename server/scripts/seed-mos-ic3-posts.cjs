/**
 * Upsert 2 bài: cấu trúc đề thi MOS & IC3 vào DB.
 * Chạy: node scripts/seed-mos-ic3-posts.cjs  (từ thư mục server/)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const { MOS_IC3_POSTS } = require('../prisma/seedMosIc3Posts');

const prisma = new PrismaClient();

async function main() {
  const admin =
    (await prisma.user.findFirst({ where: { role: 'ADMIN' } })) ||
    (await prisma.user.findFirst());
  if (!admin) {
    throw new Error('Không tìm thấy user admin — hãy seed DB trước.');
  }

  let category = await prisma.category.findFirst({
    where: { slug: 'tin-tuc-cong-nghe', type: 'post' },
  });
  if (!category) {
    category = await prisma.category.upsert({
      where: { slug: 'tin-tuc-cong-nghe' },
      update: {},
      create: { name: 'Tin Tức Công Nghệ', slug: 'tin-tuc-cong-nghe', type: 'post' },
    });
  }

  for (const p of MOS_IC3_POSTS) {
    const data = {
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      thumbnail: p.thumbnail || null,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      focusKeyword: p.focusKeyword,
      tags: p.tags,
      tableOfContents: p.tableOfContents,
      canonicalUrl: p.canonicalUrl,
      isPublished: true,
      isFeatured: true,
      noIndex: false,
      categoryId: category.id,
      authorId: admin.id,
    };

    const row = await prisma.post.upsert({
      where: { slug: p.slug },
      update: data,
      create: { ...data, slug: p.slug, views: p.views || 0 },
    });
    console.log('OK', row.slug, '→ id', row.id);
  }

  console.log('Done. Posts:', MOS_IC3_POSTS.map((p) => `/blog/${p.slug}`).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
