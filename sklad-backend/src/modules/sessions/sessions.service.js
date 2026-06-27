import prisma from "../../config/db.js";

// Текущая открытая касса — ОДНА на магазин (открывает админ, продавцы подключаются)
export const getCurrent = async () => {
  return prisma.cashSession.findFirst({
    where: { status: "OPEN" },
    include: {
      movements: { orderBy: { createdAt: "desc" } },
      seller: { select: { name: true } },
    },
  });
};

// Открыть кассу (только админ)
export const open = async (openedById, data) => {
  const existing = await prisma.cashSession.findFirst({ where: { status: "OPEN" } });
  if (existing) throw { status: 400, message: "Касса уже открыта" };
  return prisma.cashSession.create({
    data: {
      sellerId: openedById,
      openingCash: Number(data.openingCash) || 0,
      openingNote: data.note || data.openingNote || null,
    },
  });
};

// Переоткрыть закрытую кассу (только админ) — для исправления ошибок подсчёта
export const reopen = async (id) => {
  const session = await prisma.cashSession.findUnique({ where: { id } });
  if (!session) throw { status: 404, message: "Касса не найдена" };
  if (session.status === "OPEN") throw { status: 400, message: "Касса уже открыта" };
  const other = await prisma.cashSession.findFirst({ where: { status: "OPEN" } });
  if (other) throw { status: 400, message: "Сначала закройте текущую открытую кассу" };
  return prisma.cashSession.update({
    where: { id },
    data: { status: "OPEN", closedAt: null, closingCash: null, expectedCash: null, difference: null },
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

// Разбивка по методам оплаты (как в Odoo «Закрытие кассы»): наличные/карта/аккаунт клиента.
// Только для отображения — расчёт ожидаемой наличности (close) не меняется.
const computeBreakdown = async (session) => {
  const sales = await prisma.sale.findMany({
    where: { sessionId: session.id, status: "COMPLETED" },
    include: { debt: true },
  });
  let cash = 0, card = 0, account = 0;
  for (const s of sales) {
    const tot = Number(s.totalAmount) || 0;
    const debt = Number(s.debt?.amount) || 0;
    if (s.paymentType === "CARD") card += tot;
    else if (s.paymentType === "DEBT") account += debt || tot;
    else if (s.paymentType === "MIXED") { account += debt; cash += Math.max(0, tot - debt); }
    else cash += tot; // CASH
  }
  const movements = await prisma.cashMovement.findMany({ where: { sessionId: session.id } });
  let movNet = 0;
  for (const m of movements) movNet += m.type === "IN" ? Number(m.amount) : -Number(m.amount);
  const opening = Number(session.openingCash) || 0;
  return {
    cash: { opening: Math.round(opening), payments: Math.round(cash), movements: Math.round(movNet), expected: Math.round(opening + cash + movNet) },
    card: { payments: Math.round(card), expected: Math.round(card) },
    account: { payments: Math.round(account), expected: Math.round(account) },
  };
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
  const breakdown = await computeBreakdown(session);
  return { ...session, expectedCash, salesTotal, breakdown };
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
