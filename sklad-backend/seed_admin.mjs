import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: "postgresql://postgres:xvQqnVlZVBkoXleMHaueyJfqzZcNESjW@kodama.proxy.rlwy.net:32381/railway" });
const prisma = new PrismaClient({ adapter });

const hash = await bcrypt.hash("admin123", 10);
const user = await prisma.user.upsert({
  where: { phone: "+998901234567" },
  update: {},
  create: { name: "Admin", phone: "+998901234567", password: hash, role: "ADMIN" }
});
console.log("Admin yaratildi:", user.id);
await prisma.$disconnect();
