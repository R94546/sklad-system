import prisma from '../../config/db.js';

export const getAll = async (query) => {
  const { page = 1, limit = 20, userId, status } = query;
  const where = { ...(userId && { userId }), ...(status && { status }) };
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
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    for (const item of normalizedItems) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw { status: 404, message: 'Товар не найден' };
      if (Number(product.quantity) < item.quantity) throw { status: 400, message: product.name + ': недостаточно на складе (остаток: ' + product.quantity + ')' };
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
      if (!clientId) throw { status: 400, message: 'Для долга выберите клиента' };
      if (!data.dueDate) throw { status: 400, message: 'Укажите срок долга' };
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
    if (!sale) throw { status: 404, message: 'Не найдено' };
    if (sale.status === 'CANCELLED') throw { status: 400, message: 'Уже отменён' };

    // Возврат остатка только если он был списан (завершённая продажа)
    if (sale.status === 'COMPLETED') {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }
    }

    return tx.sale.update({ where: { id }, data: { status: 'CANCELLED' } });
  });
};

export const remove = async (id) => {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id }, include: { items: true } });
    if (!sale) throw { status: 404, message: 'Продажа не найдена' };
    // Возврат остатка только если он был списан (завершённая продажа)
    if (sale.status === 'COMPLETED') {
      for (const item of sale.items) {
        await tx.product.update({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } });
      }
    }
    await tx.debt.deleteMany({ where: { saleId: id } });
    await tx.saleItem.deleteMany({ where: { saleId: id } });
    await tx.sale.delete({ where: { id } });
    return { success: true };
  });
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

// Создать новый пустой чек (параллельная корзина).
// Переиспользуем уже существующий пустой чек, чтобы не плодить фантомные корзины.
export const createCart = async (userId) => {
  const empty = await prisma.sale.findFirst({
    where: { userId, status: "PENDING", items: { none: {} } },
    include: { client: true, user: true, items: { include: { product: true } } },
  });
  if (empty) return empty;
  return prisma.sale.create({
    data: { userId, status: "PENDING", totalAmount: 0, paymentType: "CASH" },
    include: { client: true, user: true, items: { include: { product: true } } },
  });
};

export const addToCart = async (userId, productId, quantity, price, saleId) => {
  // Независимые запросы — параллельно (меньше round-trip к БД)
  const [product, foundCart] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    saleId
      ? prisma.sale.findFirst({ where: { id: saleId, userId, status: "PENDING" } })
      : prisma.sale.findFirst({ where: { userId, status: "PENDING" } }),
  ]);
  if (!product) throw { status: 404, message: "Товар не найден" };

  let cart = foundCart;
  if (saleId && !cart) throw { status: 404, message: "Корзина не найдена" };
  if (!cart) {
    cart = await prisma.sale.create({
      data: { userId, status: "PENDING", totalAmount: 0, paymentType: "CASH" }
    });
  }

  const existing = await prisma.saleItem.findFirst({ where: { saleId: cart.id, productId } });
  
  if (existing) {
    await prisma.saleItem.update({ where: { id: existing.id }, data: { quantity: { increment: quantity } } });
  } else {
    await prisma.saleItem.create({ data: { saleId: cart.id, productId, quantity, price: price || product.sellPrice } });
  }
  
  const items = await prisma.saleItem.findMany({ where: { saleId: cart.id } });
  const total = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  
  return prisma.sale.update({
    where: { id: cart.id },
    data: { totalAmount: total },
    include: { items: { include: { product: true } } }
  });
};

export const removeFromCart = async (userId, itemId) => {
  const item = await prisma.saleItem.findUnique({ where: { id: itemId } });
  if (!item) throw { status: 404, message: "Позиция не найдена" };
  const cart = await prisma.sale.findFirst({ where: { id: item.saleId, userId, status: "PENDING" } });
  if (!cart) throw { status: 404, message: "Корзина не найдена" };
  await prisma.saleItem.delete({ where: { id: itemId } });
  const items = await prisma.saleItem.findMany({ where: { saleId: cart.id } });
  const total = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  return prisma.sale.update({ where: { id: cart.id }, data: { totalAmount: total }, include: { items: { include: { product: true } } } });
};

export const confirmCart = async (cartId, data) => {
  // Вся операция атомарна: проверка остатков + списание + оформление + долг
  return prisma.$transaction(async (tx) => {
    const cart = await tx.sale.findUnique({ where: { id: cartId }, include: { items: { include: { product: true } } } });
    if (!cart) throw { status: 404, message: "Корзина не найдена" };
    if (cart.status !== "PENDING") throw { status: 400, message: "Чек уже оформлен" };
    if (!cart.items.length) throw { status: 400, message: "Чек пуст" };

    // Списание остатка атомарным условным запросом (защита от ухода в минус и гонки параллельных чеков)
    for (const item of cart.items) {
      const res = await tx.product.updateMany({
        where: { id: item.productId, quantity: { gte: item.quantity } },
        data: { quantity: { decrement: item.quantity } },
      });
      if (res.count === 0) {
        throw { status: 400, message: `${item.product.name}: недостаточно на складе (остаток: ${item.product.quantity})` };
      }
    }

    // Привязка к открытой смене продавца (если открыта)
    const session = await tx.cashSession.findFirst({ where: { sellerId: cart.userId, status: "OPEN" } });

    const total = cart.items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
    const discountType = data.discountType || "AMOUNT";
    const discountVal = Number(data.discount || 0);
    const discountAmount = discountType === "PERCENT" ? (total * discountVal / 100) : discountVal;
    const finalTotal = total - discountAmount;

    const updated = await tx.sale.update({
      where: { id: cartId },
      data: { status: "COMPLETED", paymentType: data.paymentType || "CASH", clientId: data.clientId || null, discount: discountAmount, discountType: discountType, totalAmount: finalTotal, sessionId: session?.id || null, note: data.note || null },
      include: { client: true, user: true, items: { include: { product: true } } }
    });

    if (data.paymentType === "DEBT" || data.paymentType === "MIXED") {
      if (!data.clientId) throw { status: 400, message: "Для долга выберите клиента" };
      const debtAmount = data.paymentType === "MIXED" ? Number(data.debtAmount || 0) : finalTotal;
      if (debtAmount <= 0) throw { status: 400, message: "Сумма долга должна быть больше 0" };
      if (debtAmount > finalTotal + 0.01) throw { status: 400, message: "Сумма долга больше суммы чека" };
      await tx.debt.create({ data: { saleId: cartId, clientId: data.clientId, amount: debtAmount, dueDate: new Date(data.dueDate || Date.now() + 30*24*60*60*1000) } });
    }

    return updated;
  });
};

export const updateCartItem = async (userId, itemId, quantity, price) => {
  const item = await prisma.saleItem.findUnique({ where: { id: itemId } });
  if (!item) throw { status: 404, message: "Позиция не найдена" };
  const cart = await prisma.sale.findFirst({ where: { id: item.saleId, userId, status: "PENDING" } });
  if (!cart) throw { status: 404, message: "Корзина не найдена" };
  if (quantity !== undefined) {
    const qty = Number(quantity);
    if (qty <= 0) { await prisma.saleItem.delete({ where: { id: itemId } }); }
    else { await prisma.saleItem.update({ where: { id: itemId }, data: { quantity: qty } }); }
  }
  if (price !== undefined && price !== null && price !== "") {
    await prisma.saleItem.update({ where: { id: itemId }, data: { price: Number(price) } });
  }
  const items = await prisma.saleItem.findMany({ where: { saleId: cart.id } });
  const total = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  return prisma.sale.update({ where: { id: cart.id }, data: { totalAmount: total }, include: { items: { include: { product: true } } } });
};

