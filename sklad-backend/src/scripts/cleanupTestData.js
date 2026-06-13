import 'dotenv/config';
import { rawPrisma as prisma } from '../config/db.js';

// Удаляет тестовые склады со всеми зависимыми строками (порядок важен из-за FK RESTRICT).
const TEST_ORG_NAMES = ['__HTTP_TEST__', '__TEST_ORG_B__'];

const run = async () => {
  // висячие тестовые товары/категории по имени
  await prisma.product.deleteMany({ where: { name: { startsWith: '__TEST_P_' } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: '__test_cat_' } } });

  const orgs = await prisma.organization.findMany({ where: { name: { in: TEST_ORG_NAMES } }, select: { id: true, name: true } });
  for (const o of orgs) {
    const users = await prisma.user.findMany({ where: { organizationId: o.id }, select: { id: true } });
    const userIds = users.map((u) => u.id);
    await prisma.auditLog.deleteMany({ where: { OR: [{ organizationId: o.id }, { userId: { in: userIds } }] } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.debtPayment.deleteMany({ where: { organizationId: o.id } });
    await prisma.cashMovement.deleteMany({ where: { organizationId: o.id } });
    await prisma.saleItem.deleteMany({ where: { organizationId: o.id } });
    await prisma.debt.deleteMany({ where: { organizationId: o.id } });
    await prisma.sale.deleteMany({ where: { organizationId: o.id } });
    await prisma.stockIn.deleteMany({ where: { organizationId: o.id } });
    await prisma.cashSession.deleteMany({ where: { organizationId: o.id } });
    await prisma.product.deleteMany({ where: { organizationId: o.id } });
    await prisma.category.deleteMany({ where: { organizationId: o.id } });
    await prisma.settings.deleteMany({ where: { organizationId: o.id } });
    await prisma.user.deleteMany({ where: { organizationId: o.id } });
    await prisma.organization.delete({ where: { id: o.id } });
    console.log('O‘chirildi:', o.name);
  }
  console.log('Test ma‘lumotlari tozalandi ✅');
};

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
