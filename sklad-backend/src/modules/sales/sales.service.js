import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const getAll = async (query) => {
  const { page = 1, limit = 20, userId } = query;
  const where = { ...(userId && { userId }) };
  const [data, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: { user: { select: { name: true } }, client: { select: { name: true, phone: true } }, items: { include: { product: { select: { name: true, unit: true } } } } },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sale.count({ where }),
  ]);
  return { data, total, page: Number(page), limit: Number(limit) };
};

export const getById = async (id) => {
  return prisma.sale.findUnique({
    where: { id },
    include: { user: { select: { name: true } }, client: true, items: { include: { product: true } }, debt: true },
  });
};

export const create = async (data, userId) => {
  const { items, clientId, paymentType } = data;
  const discount = Number(data.discount) || 0;

return prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    const normalizedItems = items.map(item => ({
      productId: item.productId,
      quantity: parseInt(item.quantity),
      price: Number(item.price),
    }));

    for (const item of normalizedItems) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw { status: 404, message: 'Mahsulot topilmadi' };
      if (product.quantity < item.quantity) throw { status: 400, message: product.name + ' yetarli emas (qoldiq: ' + product.quantity + ')' };
      totalAmount += item.price * item.quantity;
    }

    const finalAmount = totalAmount - discount;

    const sale = await tx.sale.create({
      data: {
        userId,
        clientId: clientId || null,
        totalAmount: finalAmount,
        discount,
        paymentType,
        items: { create: normalizedItems },
      },
      include: { items: true },
    });

    for (const item of normalizedItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    if (paymentType === 'DEBT' || paymentType === 'MIXED') {
      if (!clientId) throw { status: 400, message: 'Nasiya uchun mijoz tanlansin' };
      if (!data.dueDate) throw { status: 400, message: 'Nasiya muddati kiritilsin' };
      const debtAmount = paymentType === 'MIXED' ? (Number(data.debtAmount) || finalAmount) : finalAmount;
      await tx.debt.create({
        data: {
          saleId: sale.id,
          clientId,
          amount: debtAmount,
          dueDate: new Date(data.dueDate),
        },
      });
    }

    return sale;
  });
};

export const cancel = async (id) => {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id }, include: { items: true } });
    if (!sale) throw { status: 404, message: 'Topilmadi' };
    if (sale.status === 'CANCELLED') throw { status: 400, message: 'Allaqachon bekor qilingan' };

    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }

    return tx.sale.update({ where: { id }, data: { status: 'CANCELLED' } });
  });
};
