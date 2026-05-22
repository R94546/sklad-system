import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const getAll = async (query) => {
  const { status, clientId, page = 1, limit = 20 } = query;
  const where = {
    ...(status && { status }),
    ...(clientId && { clientId }),
  };
  const [data, total] = await Promise.all([
    prisma.debt.findMany({
      where,
      include: { client: { select: { name: true, phone: true } }, sale: { select: { totalAmount: true, createdAt: true } } },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { dueDate: 'asc' },
    }),
    prisma.debt.count({ where }),
  ]);
  return { data, total, page: Number(page), limit: Number(limit) };
};

export const getById = async (id) => {
  return prisma.debt.findUnique({
    where: { id },
    include: { client: true, sale: { include: { items: { include: { product: true } } } } },
  });
};

export const pay = async (id, amount) => {
  const debt = await prisma.debt.findUnique({ where: { id } });
  if (!debt) throw { status: 404, message: 'Topilmadi' };

  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) throw { status: 400, message: 'Tolov summasi nototri' };

  const newPaid = Number(debt.paid) + payAmount;
  const remaining = Number(debt.amount) - newPaid;
  const status = remaining <= 0 ? 'PAID' : 'PENDING';

  return prisma.debt.update({
    where: { id },
    data: { paid: newPaid, status },
  });
};

export const getOverdue = async () => {
  return prisma.debt.findMany({
    where: { status: 'PENDING', dueDate: { lt: new Date() } },
    include: { client: { select: { name: true, phone: true } } },
  });
};
