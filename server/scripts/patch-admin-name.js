/**
 * patch-admin-name.js
 * Cap nhat fullName cua admin user trong database.
 * Chay: node server/scripts/patch-admin-name.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Patching admin user fullName...");

  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { fullName: "Admin Tin hoc 24h" },
        { fullName: "Admin Tin học 24h" },
        { fullName: { contains: "24h" } },
        { fullName: { contains: "tinhoc24h" } },
        { email: "admin@gmail.com" },
        { email: "thangtinhoc@gmail.com" },
      ],
    },
    data: { fullName: "Thắng Tin Học" },
  });

  console.log("Updated " + result.count + " admin user(s).");

  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, email: true, fullName: true, role: true },
  });
  console.log("Admin users sau khi patch:");
  admins.forEach(function(a) {
    console.log("  - [" + a.id + "] " + a.email + " -> " + a.fullName);
  });
}

main()
  .catch(function(e) { console.error("Error:", e.message); process.exit(1); })
  .finally(function() { return prisma.$disconnect(); });
