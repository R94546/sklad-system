process.env.DATABASE_URL = "postgresql://postgres:xvQqnVlZVBkoXleMHaueyJfqzZcNESjW@kodama.proxy.rlwy.net:32381/railway";
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { phone: "+998901234567" },
    update: {},
    create: { name: "Admin", phone: "+998901234567", password: hash, role: "ADMIN" }
  });
  console.log("Admin yaratildi:", user.id);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
