import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const getAll = async (query) => {
  const { search, page = 1, limit = 20 } = query;
  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    }),
  };
  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);
  return { data, total, page: Number(page), limit: Number(limit) };
};

export const getById = async (id) => {
  return prisma.client.findUnique({
    where: { id },
    include: {
      debts: { orderBy: { createdAt: 'desc' } },
      sales: { take: 10, orderBy: { createdAt: 'desc' }, include: { items: { include: { product: { select: { name: true } } } } } },
    },
  });
};

export const create = async (data) => {
  return prisma.client.create({
    data: {
      name: data.name?.trim(),
      phone: data.phone?.trim(),
      address: data.address?.trim() || null,
      note: data.note?.trim() || null,
    },
  });
};

export const update = async (id, data) => {
  return prisma.client.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address !== undefined && { address: data.address?.trim() || null }),
      ...(data.note !== undefined && { note: data.note?.trim() || null }),
    },
  });
};

export const block = async (id, isBlocked) => {
  return prisma.client.update({ where: { id }, data: { isBlocked: Boolean(isBlocked) } });
};
