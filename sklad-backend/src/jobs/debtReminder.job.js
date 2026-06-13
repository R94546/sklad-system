import cron from 'node-cron';
import { rawPrisma as prisma } from '../config/db.js';
import { sendSms } from '../utils/sms.js';

// Cron работает вне запроса (нет org-контекста) и должен видеть долги ВСЕХ складов,
// поэтому используем rawPrisma (без org-фильтра).

const checkDebts = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const dueTomorrow = await prisma.debt.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: tomorrow, lt: dayAfter },
      },
      include: { client: true },
    });

    for (const debt of dueTomorrow) {
      const remaining = Number(debt.amount) - Number(debt.paid);
      const msg = 'Hurmatli ' + debt.client.name + ', ertaga ' + remaining.toLocaleString() + " so'm qarzingiz muddati tugaydi. Iltimos vaqtida toing.";
      await sendSms(debt.client.phone, msg);
      console.log('Eslatma yuborildi:', debt.client.name);
    }

    const overdue = await prisma.debt.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
      include: { client: true },
    });

    for (const debt of overdue) {
      await prisma.debt.update({ where: { id: debt.id }, data: { status: 'OVERDUE' } });
      const remaining = Number(debt.amount) - Number(debt.paid);
      const msg = 'Hurmatli ' + debt.client.name + ', ' + remaining.toLocaleString() + " so'm qarz muddatingiz otib ketdi. Iltimos tez orada tolag.";
      await sendSms(debt.client.phone, msg);
    }

    console.log('Debt check tugadi:', new Date().toLocaleString());
  } catch (err) {
    console.error('Debt reminder xatosi:', err.message);
  }
};

export const startDebtReminderJob = () => {
  cron.schedule('0 20 * * *', checkDebts);
  console.log('Debt reminder job ishga tushdi (har kuni 20:00)');
};
