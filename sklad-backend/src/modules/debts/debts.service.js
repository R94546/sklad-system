import prisma from '../../config/db.js';

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
    include: {
      client: true,
      sale: { include: { items: { include: { product: true } } } },
      payments: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } },
    },
  });
};

export const pay = async (id, amount, method, userId) => {
  const debt = await prisma.debt.findUnique({ where: { id } });
  if (!debt) throw { status: 404, message: 'Долг не найден' };

  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) throw { status: 400, message: 'Неверная сумма оплаты' };

  const remaining = Number(debt.amount) - Number(debt.paid);
  if (payAmount - remaining > 0.001) throw { status: 400, message: `Сумма больше остатка долга (${remaining.toLocaleString('ru-RU')})` };

  const payMethod = method === 'CARD' ? 'CARD' : 'CASH';
  const newPaid = Number(debt.paid) + payAmount;
  const status = Number(debt.amount) - newPaid <= 0 ? 'PAID'
    : debt.dueDate < new Date() ? 'OVERDUE' : 'PENDING';

  const [updated] = await prisma.$transaction([
    prisma.debt.update({ where: { id }, data: { paid: newPaid, status } }),
    prisma.debtPayment.create({ data: { debtId: id, amount: payAmount, method: payMethod, userId: userId || null } }),
  ]);
  return updated;
};

export const getOverdue = async () => {
  return prisma.debt.findMany({
    where: { status: 'PENDING', dueDate: { lt: new Date() } },
    include: { client: { select: { name: true, phone: true } } },
  });
};
