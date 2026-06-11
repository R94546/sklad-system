import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const select = { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true, imageUrl: true, maxDiscountPercent: true, canEditPrice: true };

export const getAll = async () => {
  return prisma.user.findMany({ select, orderBy: { createdAt: 'desc' } });
};

export const getById = async (id) => {
  return prisma.user.findUnique({ where: { id }, select });
};

export const create = async (data) => {
  if (!data.name?.trim()) throw { status: 400, message: 'Введите имя' };
  if (!data.phone?.trim()) throw { status: 400, message: 'Введите телефон' };
  if (!data.password) throw { status: 400, message: 'Введите пароль' };
  const hashed = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      name: data.name.trim(),
      phone: data.phone.trim(),
      password: hashed,
      role: data.role || 'SELLER',
      maxDiscountPercent: Number(data.maxDiscountPercent) || 0,
      canEditPrice: Boolean(data.canEditPrice),
    },
    select,
  });
};

export const update = async (id, data) => {
  const updateData = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.phone) updateData.phone = data.phone.trim();
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);
  if (data.role) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.maxDiscountPercent !== undefined) updateData.maxDiscountPercent = Number(data.maxDiscountPercent) || 0;
  if (data.canEditPrice !== undefined) updateData.canEditPrice = Boolean(data.canEditPrice);
  return prisma.user.update({ where: { id }, data: updateData, select });
};

export const remove = async (id) => {
  return prisma.user.update({ where: { id }, data: { isActive: false }, select });
};

