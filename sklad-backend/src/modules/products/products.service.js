import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const getAll = async (query) => {
  const { search, categoryId, page = 1, limit = 20 } = query;
  const where = {
    isActive: true,
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
    ...(categoryId && { categoryId }),
  };
  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);
  return { data, total, page: Number(page), limit: Number(limit) };
};

export const getById = async (id) => {
  return prisma.product.findUnique({ where: { id }, include: { category: true } });
};

export const create = async (data) => {
  return prisma.product.create({
    data: {
      ...data,
      buyPrice: Number(data.buyPrice),
      sellPrice: Number(data.sellPrice),
      quantity: parseInt(data.quantity),
      minStock: parseInt(data.minStock) || 10,
    },
    include: { category: true },
  });
};

export const update = async (id, data) => {
  return prisma.product.update({
    where: { id },
    data: {
      ...data,
      buyPrice: data.buyPrice ? Number(data.buyPrice) : undefined,
      sellPrice: data.sellPrice ? Number(data.sellPrice) : undefined,
      quantity: data.quantity ? parseInt(data.quantity) : undefined,
      minStock: data.minStock ? parseInt(data.minStock) : undefined,
    },
    include: { category: true },
  });
};

export const remove = async (id) => {
  return prisma.product.update({ where: { id }, data: { isActive: false } });
};

export const getLowStock = async () => {
  return prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
  });
};
