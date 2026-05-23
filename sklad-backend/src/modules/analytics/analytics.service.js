import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const getDashboard = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todaySales, monthSales, totalDebt, lowStock, totalClients] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.debt.aggregate({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { amount: true },
    }),
    prisma.product.count({
      where: { isActive: true, quantity: { lte: 10 } },
    }),
    prisma.client.count(),
  ]);

  return {
    today: { amount: todaySales._sum.totalAmount || 0, count: todaySales._count },
    month: { amount: monthSales._sum.totalAmount || 0, count: monthSales._count },
    totalDebt: totalDebt._sum.amount || 0,
    lowStockCount: lowStock,
    totalClients,
  };
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
  const items = await prisma.saleItem.findMany({
    select: { productId: true, quantity: true, price: true },
  });
  const grouped = {};
  for (const item of items) {
    if (!grouped[item.productId]) grouped[item.productId] = { qty: 0, amount: 0 };
    grouped[item.productId].qty += item.quantity;
    grouped[item.productId].amount += Number(item.price) * item.quantity;
  }
  const sorted = Object.entries(grouped).sort((a, b) => b[1].amount - a[1].amount).slice(0, 10);
  const products = await Promise.all(sorted.map(async ([productId, data]) => {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, unit: true } });
    return { name: product?.name || "Noaniq", totalSold: data.qty, totalAmount: data.amount };
  }));
  return products;
};

export const getTopProfitProducts = async () => {
  const items = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  });
  const products = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, buyPrice: true, sellPrice: true, unit: true },
      });
      if (!product) return null;
      const qty = item._sum.quantity || 0;
      const profit = (Number(product.sellPrice) - Number(product.buyPrice)) * qty;
      return { name: product.name, profit, qty, unit: product.unit };
    })
  );
  return products.filter(Boolean).sort((a, b) => b.profit - a.profit);
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
      return { name: user?.name || 'Noaniq', totalAmount: s._sum.totalAmount, count: s._count };
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
      where: { userId, status: { in: ["COMPLETED", "PENDING"] }, createdAt: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { userId, status: { in: ["COMPLETED", "PENDING"] }, createdAt: { gte: monthStart } },
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
