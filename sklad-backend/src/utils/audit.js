import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const audit = async (userId, action, entity, entityId = null, oldData = null, newData = null) => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldData, newData },
    });
  } catch (err) {
    console.error('Audit log xatosi:', err.message);
  }
};
