const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = [
    ['promo_enabled', 'true'],
    ['promo_image', '/promo-popup-1kem1.png'],
    ['promo_link', '/lien-he'],
    ['promo_title', 'Ưu đãi học viên mới'],
  ];
  for (const [key, value] of rows) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    console.log('ok', key, '=', value);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
