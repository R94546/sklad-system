import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '+998901234567' },
    update: {},
    create: {
      name: 'Admin',
      phone: '+998901234567',
      password,
      role: 'ADMIN',
    },
  });
  console.log('Admin yaratildi:', admin.name, admin.phone);
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
