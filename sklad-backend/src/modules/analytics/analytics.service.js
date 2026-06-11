import prisma from '../../config/db.js';

export const getDashboard = async () => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const [
    todaySales, monthSales, yesterdaySales, prevMonthSales,
    totalDebtAgg, overdueDebts, activeProducts, totalClients,
    monthCompleted, periodItems, openSessions,
  ] = await Promise.all([
    prisma.sale.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: today, lt: tomorrow } }, _sum: { totalAmount: true }, _count: true }),
    prisma.sale.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: monthStart } }, _sum: { totalAmount: true }, _count: true }),
    prisma.sale.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: yesterday, lt: today } }, _sum: { totalAmount: true } }),
    prisma.sale.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: prevMonthStart, lt: monthStart } }, _sum: { totalAmount: true } }),
    prisma.debt.aggregate({ where: { status: { in: ['PENDING', 'OVERDUE'] } }, _sum: { amount: true, paid: true } }),
    // Просрочка: срок прошёл и долг не погашен (не зависит от того, отработал ли cron-джоб)
    prisma.debt.findMany({ where: { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: now } }, select: { amount: true, paid: true } }),
    prisma.product.findMany({ where: { isActive: true }, select: { quantity: true, minStock: true, buyPrice: true } }),
    prisma.client.count(),
    // Разбивка оборота по способам оплаты за месяц
    prisma.sale.findMany({ where: { status: 'COMPLETED', createdAt: { gte: monthStart } }, select: { totalAmount: true, paymentType: true } }),
    // Позиции завершённых продаж за месяц — для прибыли (факт. цена − закупка)
    prisma.saleItem.findMany({ where: { sale: { status: 'COMPLETED', createdAt: { gte: monthStart } } }, select: { quantity: true, price: true, sale: { select: { createdAt: true } }, product: { select: { buyPrice: true } } } }),
    prisma.cashSession.count({ where: { status: 'OPEN' } }),
  ]);

  const lowStockCount = activeProducts.filter((p) => p.quantity <= p.minStock).length;
  const stockValue = activeProducts.reduce((s, p) => s + p.quantity * Number(p.buyPrice), 0);

  const totalDebt = Number(totalDebtAgg._sum.amount || 0) - Number(totalDebtAgg._sum.paid || 0);
  const overdueAmount = overdueDebts.reduce((s, d) => s + (Number(d.amount) - Number(d.paid)), 0);

  const payments = { CASH: 0, CARD: 0, DEBT: 0, MIXED: 0 };
  for (const s of monthCompleted) {
    if (payments[s.paymentType] !== undefined) payments[s.paymentType] += Number(s.totalAmount);
  }

  let todayProfit = 0, monthProfit = 0;
  for (const it of periodItems) {
    const p = (Number(it.price) - Number(it.product?.buyPrice || 0)) * it.quantity;
    monthProfit += p;
    if (it.sale.createdAt >= today) todayProfit += p;
  }

  return {
    today: { amount: Number(todaySales._sum.totalAmount || 0), count: todaySales._count, profit: todayProfit },
    month: { amount: Number(monthSales._sum.totalAmount || 0), count: monthSales._count, profit: monthProfit },
    prev: { today: Number(yesterdaySales._sum.totalAmount || 0), month: Number(prevMonthSales._sum.totalAmount || 0) },
    totalDebt,
    overdue: { amount: overdueAmount, count: overdueDebts.length },
    lowStockCount,
    totalClients,
    stockValue,
    payments,
    openSessions,
  };
};

// Товары с малым остатком (quantity <= minStock)
export const getLowStock = async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, quantity: true, minStock: true, unit: true, sellPrice: true },
  });
  return products
    .filter((p) => p.quantity <= p.minStock)
    .sort((a, b) => a.quantity - b.quantity);
};

export const getSalesChart = async (period = 'week') => {
  const days = period === 'month' ? 30 : period === 'year' ? 365 : 7;
  const from = new Date();
  from.setDate(from.getDate() - days);

  const sales = await prisma.sale.findMany({
    where: { status: 'COMPLETED', createdAt: { gte: from } },
    select: { totalAmount: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = {};
  for (const sale of sales) {
    const date = sale.createdAt.toISOString().split('T')[0];
    if (!grouped[date]) grouped[date] = 0;
    grouped[date] += Number(sale.totalAmount);
  }

  return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
};

export const getTopProducts = async () => {
  // Только завершённые продажи (без корзин/отмен/возвратов)
  const items = await prisma.saleItem.findMany({
    where: { sale: { status: 'COMPLETED' } },
    select: { productId: true, quantity: true, price: true, product: { select: { name: true, unit: true } } },
  });
  const grouped = {};
  for (const item of items) {
    const g = grouped[item.productId] || (grouped[item.productId] = { name: item.product?.name || "Неизвестно", qty: 0, amount: 0 });
    g.qty += item.quantity;
    g.amount += Number(item.price) * item.quantity;
  }
  return Object.values(grouped)
    .map((g) => ({ name: g.name, totalSold: g.qty, totalAmount: g.amount }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);
};

export const getTopProfitProducts = async () => {
  // Прибыль по фактической цене продажи (SaleItem.price) минус закупочная цена товара,
  // только по завершённым продажам.
  const items = await prisma.saleItem.findMany({
    where: { sale: { status: 'COMPLETED' } },
    select: { productId: true, quantity: true, price: true, product: { select: { name: true, buyPrice: true, unit: true } } },
  });
  const grouped = {};
  for (const item of items) {
    if (!item.product) continue;
    const g = grouped[item.productId] || (grouped[item.productId] = { name: item.product.name, unit: item.product.unit, qty: 0, profit: 0 });
    g.qty += item.quantity;
    g.profit += (Number(item.price) - Number(item.product.buyPrice)) * item.quantity;
  }
  return Object.values(grouped).sort((a, b) => b.profit - a.profit).slice(0, 10);
};




export const getSellerStats = async () => {
  const sellers = await prisma.sale.groupBy({
    by: ['userId'],
    where: { status: 'COMPLETED' },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: 'desc' } },
  });
  return Promise.all(
    sellers.map(async (s) => {
      const user = await prisma.user.findUnique({
        where: { id: s.userId },
        select: { name: true },
      });
      return { name: user?.name || 'Неизвестно', totalAmount: s._sum.totalAmount, count: s._count };
    })
  );
};

export const getSellerDashboard = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [todaySales, monthSales, totalClients] = await Promise.all([
    prisma.sale.aggregate({
      where: { userId, status: "COMPLETED", createdAt: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { userId, status: "COMPLETED", createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.client.count(),
  ]);
  return {
    today: { amount: todaySales._sum.totalAmount || 0, count: todaySales._count },
    month: { amount: monthSales._sum.totalAmount || 0, count: monthSales._count },
    totalDebt: 0,
    lowStockCount: 0,
    totalClients,
  };
};
