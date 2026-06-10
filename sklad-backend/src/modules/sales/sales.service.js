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

export const remove = async (id) => {
  const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
  if (!sale) throw { status: 404, message: 'Sotuv topilmadi' };
  for (const item of sale.items) {
    await prisma.product.update({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } });
  }
  await prisma.saleItem.deleteMany({ where: { saleId: id } });
  await prisma.sale.delete({ where: { id } });
  return { success: true };
};

export const updateSale = async (id, data) => {
  const updateData = {};
  if (data.clientId) updateData.clientId = data.clientId;
  if (data.paymentType) updateData.paymentType = data.paymentType;
  if (data.status) updateData.status = data.status;
  if (data.discount !== undefined) updateData.discount = Number(data.discount);
  return prisma.sale.update({ where: { id }, data: updateData, include: { client: true, user: true, items: { include: { product: true } } } });
};

export const getCart = async (userId) => {
  return prisma.sale.findFirst({
    where: { userId, status: "PENDING" },
    include: { client: true, user: true, items: { include: { product: true } } }
  });
};

// Все открытые чеки (параллельные корзины) продавца
export const getCarts = async (userId) => {
  return prisma.sale.findMany({
    where: { userId, status: "PENDING" },
    include: { client: true, user: true, items: { include: { product: true } } },
    orderBy: { number: "asc" },
  });
};

// Создать новый пустой чек (параллельная корзина)
export const createCart = async (userId) => {
  return prisma.sale.create({
    data: { userId, status: "PENDING", totalAmount: 0, paymentType: "CASH" },
    include: { client: true, user: true, items: { include: { product: true } } },
  });
};

export const addToCart = async (userId, productId, quantity, price, saleId) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw { status: 404, message: "Mahsulot topilmadi" };

  let cart;
  if (saleId) {
    cart = await prisma.sale.findFirst({ where: { id: saleId, userId, status: "PENDING" } });
    if (!cart) throw { status: 404, message: "Savat topilmadi" };
  } else {
    cart = await prisma.sale.findFirst({ where: { userId, status: "PENDING" } });
    if (!cart) {
      cart = await prisma.sale.create({
        data: { userId, status: "PENDING", totalAmount: 0, paymentType: "CASH" }
      });
    }
  }

  const existing = await prisma.saleItem.findFirst({ where: { saleId: cart.id, productId } });
  
  if (existing) {
    await prisma.saleItem.update({ where: { id: existing.id }, data: { quantity: { increment: quantity } } });
  } else {
    await prisma.saleItem.create({ data: { saleId: cart.id, productId, quantity, price: price || product.sellPrice } });
  }
  
  const items = await prisma.saleItem.findMany({ where: { saleId: cart.id } });
  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  
  return prisma.sale.update({
    where: { id: cart.id },
    data: { totalAmount: total },
    include: { items: { include: { product: true } } }
  });
};

export const removeFromCart = async (userId, itemId) => {
  const item = await prisma.saleItem.findUnique({ where: { id: itemId } });
  if (!item) throw { status: 404, message: "Pozitsiya topilmadi" };
  const cart = await prisma.sale.findFirst({ where: { id: item.saleId, userId, status: "PENDING" } });
  if (!cart) throw { status: 404, message: "Savat topilmadi" };
  await prisma.saleItem.delete({ where: { id: itemId } });
  const items = await prisma.saleItem.findMany({ where: { saleId: cart.id } });
  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  return prisma.sale.update({ where: { id: cart.id }, data: { totalAmount: total }, include: { items: { include: { product: true } } } });
};

export const confirmCart = async (cartId, data) => {
  const cart = await prisma.sale.findUnique({ where: { id: cartId }, include: { items: true } });
  if (!cart) throw { status: 404, message: "Savat topilmadi" };
  // Привязка к открытой смене продавца (если открыта)
  const session = await prisma.cashSession.findFirst({ where: { sellerId: cart.userId, status: "OPEN" } });
  for (const item of cart.items) {
    await prisma.product.update({ where: { id: item.productId }, data: { quantity: { decrement: item.quantity } } });
  }
  const total = cart.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const discountType = data.discountType || "AMOUNT";
  const discountVal = Number(data.discount || 0);
  const discountAmount = discountType === "PERCENT" ? (total * discountVal / 100) : discountVal;
  const finalTotal = total - discountAmount;
  const updated = await prisma.sale.update({
    where: { id: cartId },
    data: { status: "COMPLETED", paymentType: data.paymentType || "CASH", clientId: data.clientId || null, discount: discountAmount, discountType: discountType, totalAmount: finalTotal, sessionId: session?.id || null, note: data.note || null },
    include: { client: true, user: true, items: { include: { product: true } } }
  });
  if ((data.paymentType === "DEBT" || data.paymentType === "MIXED") && data.clientId) {
    const debtAmount = data.paymentType === "MIXED" ? Number(data.debtAmount || 0) : finalTotal;
    await prisma.debt.create({ data: { saleId: cartId, clientId: data.clientId, amount: debtAmount, dueDate: new Date(data.dueDate || Date.now() + 30*24*60*60*1000) } });
  }
  return updated;
};


export const sendToKassa = async (saleId) => {
  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale) throw { status: 404, message: "Sotuv topilmadi" };
  if (sale.status !== "PENDING") throw { status: 400, message: "Faqat savat holatidagi sotuvni kassaga yuborish mumkin" };
  return prisma.sale.update({
    where: { id: saleId },
    data: { status: "SENT_TO_KASSA" },
    include: { client: true, user: true, items: { include: { product: true } } }
  });
};

export const getKassaQueue = async () => {
  return prisma.sale.findMany({
    where: { status: "SENT_TO_KASSA" },
    include: { client: true, user: true, items: { include: { product: true } } },
    orderBy: { createdAt: "asc" }
  });
};

export const kassaConfirm = async (saleId, data) => {
  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!sale) throw { status: 404, message: "Sotuv topilmadi" };
  if (sale.status !== "SENT_TO_KASSA") throw { status: 400, message: "Sotuv kassa navbatida emas" };
  for (const item of sale.items) {
    await prisma.product.update({ where: { id: item.productId }, data: { quantity: { decrement: item.quantity } } });
  }
  const total = sale.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const finalTotal = total - Number(data.discount || 0);
  const updated = await prisma.sale.update({
    where: { id: saleId },
    data: { status: "COMPLETED", paymentType: data.paymentType || "CASH", clientId: data.clientId || null, discount: Number(data.discount || 0), totalAmount: finalTotal },
    include: { client: true, user: true, items: { include: { product: true } } }
  });
  if ((data.paymentType === "DEBT" || data.paymentType === "MIXED") && data.clientId) {
    const debtAmount = data.paymentType === "MIXED" ? Number(data.debtAmount || 0) : finalTotal;
    await prisma.debt.create({ data: { saleId, clientId: data.clientId, amount: debtAmount, dueDate: new Date(data.dueDate || Date.now() + 30*24*60*60*1000) } });
  }
  return updated;
};

export const kassaReturn = async (saleId, reason) => {
  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!sale) throw { status: 404, message: "Sotuv topilmadi" };
  if (sale.status === "COMPLETED") {
    for (const item of sale.items) {
      await prisma.product.update({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } });
    }
  }
  return prisma.sale.update({
    where: { id: saleId },
    data: { status: "RETURNED", returnReason: reason || "" },
    include: { client: true, user: true, items: { include: { product: true } } }
  });
};

export const updateCartItem = async (userId, itemId, quantity, price) => {
  const item = await prisma.saleItem.findUnique({ where: { id: itemId } });
  if (!item) throw { status: 404, message: "Pozitsiya topilmadi" };
  const cart = await prisma.sale.findFirst({ where: { id: item.saleId, userId, status: "PENDING" } });
  if (!cart) throw { status: 404, message: "Savat topilmadi" };
  if (quantity !== undefined) {
    const qty = parseInt(quantity);
    if (qty <= 0) { await prisma.saleItem.delete({ where: { id: itemId } }); }
    else { await prisma.saleItem.update({ where: { id: itemId }, data: { quantity: qty } }); }
  }
  if (price !== undefined && price !== null && price !== "") {
    await prisma.saleItem.update({ where: { id: itemId }, data: { price: Number(price) } });
  }
  const items = await prisma.saleItem.findMany({ where: { saleId: cart.id } });
  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  return prisma.sale.update({ where: { id: cart.id }, data: { totalAmount: total }, include: { items: { include: { product: true } } } });
};

