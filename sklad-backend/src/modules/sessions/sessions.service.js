import prisma from "../../config/db.js";

// Текущая открытая смена продавца
export const getCurrent = async (sellerId) => {
  return prisma.cashSession.findFirst({
    where: { sellerId, status: "OPEN" },
    include: { movements: { orderBy: { createdAt: "desc" } } },
  });
};

// Открыть смену
export const open = async (sellerId, data) => {
  const existing = await prisma.cashSession.findFirst({ where: { sellerId, status: "OPEN" } });
  if (existing) throw { status: 400, message: "Смена уже открыта" };
  return prisma.cashSession.create({
    data: {
      sellerId,
      openingCash: Number(data.openingCash) || 0,
      openingNote: data.note || data.openingNote || null,
    },
  });
};

// Ожидаемая наличность в кассе (открытие + наличные продажи + приход − расход)
const computeExpected = async (session) => {
  const sales = await prisma.sale.findMany({
    where: { sessionId: session.id, status: "COMPLETED" },
    include: { debt: true },
  });
  let cashFromSales = 0;
  for (const s of sales) {
    const tot = Number(s.totalAmount) || 0;
    if (s.paymentType === "CASH") cashFromSales += tot;
    else if (s.paymentType === "MIXED") cashFromSales += Math.max(0, tot - (Number(s.debt?.amount) || 0));
    // CARD, DEBT — наличными 0
  }
  const movements = await prisma.cashMovement.findMany({ where: { sessionId: session.id } });
  let movNet = 0;
  for (const m of movements) movNet += m.type === "IN" ? Number(m.amount) : -Number(m.amount);
  return Math.round(Number(session.openingCash) + cashFromSales + movNet);
};

// Закрыть смену (с расчётом разницы)
export const close = async (id, data) => {
  const session = await prisma.cashSession.findUnique({ where: { id } });
  if (!session) throw { status: 404, message: "Смена не найдена" };
  if (session.status === "CLOSED") throw { status: 400, message: "Смена уже закрыта" };
  const expectedCash = await computeExpected(session);
  const closingCash = Number(data.closingCash) || 0;
  const difference = closingCash - expectedCash;
  return prisma.cashSession.update({
    where: { id },
    data: {
      closingCash,
      expectedCash,
      difference,
      closingNote: data.note || data.closingNote || null,
      status: "CLOSED",
      closedAt: new Date(),
    },
  });
};

// Детали смены (+ продажи, движения, ожидаемая наличность)
export const getById = async (id) => {
  const session = await prisma.cashSession.findUnique({
    where: { id },
    include: {
      seller: { select: { name: true } },
      movements: { orderBy: { createdAt: "desc" } },
      sales: { where: { status: "COMPLETED" }, select: { id: true, totalAmount: true, paymentType: true, createdAt: true } },
    },
  });
  if (!session) throw { status: 404, message: "Смена не найдена" };
  const expectedCash = session.status === "OPEN" ? await computeExpected(session) : session.expectedCash;
  const salesTotal = session.sales.reduce((s, x) => s + Number(x.totalAmount), 0);
  return { ...session, expectedCash, salesTotal };
};

// Список смен (админ)
export const getAll = async (query) => {
  const { sellerId, status } = query;
  const where = { ...(sellerId && { sellerId }), ...(status && { status }) };
  return prisma.cashSession.findMany({
    where,
    include: { seller: { select: { name: true } } },
    orderBy: { openedAt: "desc" },
  });
};

// Наличные приход/расход
export const createMovement = async (data) => {
  const { sessionId, type, amount, reason } = data;
  if (!sessionId) throw { status: 400, message: "Смена не указана" };
  if (!["IN", "OUT"].includes(type)) throw { status: 400, message: "Неверный тип движения" };
  const session = await prisma.cashSession.findUnique({ where: { id: sessionId } });
  if (!session) throw { status: 404, message: "Смена не найдена" };
  if (session.status !== "OPEN") throw { status: 400, message: "Смена закрыта" };
  return prisma.cashMovement.create({
    data: { sessionId, type, amount: Number(amount) || 0, reason: reason || "" },
  });
};
