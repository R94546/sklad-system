import 'dotenv/config';
import { rawPrisma as prisma } from '../config/db.js';

// Одноразовая миграция: переносит все существующие (одно-складовые) данные
// в одну дефолтную организацию. Запускать ПОСЛЕ `prisma db push` и ДО seedSuperAdmin
// (чтобы супер-админ не попал под backfill и остался без org).
const DEFAULT_ORG_NAME = 'Asosiy sklad';

const MODELS = [
  'user', 'category', 'product', 'client', 'sale', 'saleItem',
  'debt', 'debtPayment', 'stockIn', 'cashSession', 'cashMovement',
  'auditLog', 'settings',
];

const run = async () => {
  let org = await prisma.organization.findFirst({ where: { name: DEFAULT_ORG_NAME } });
  if (!org) org = await prisma.organization.create({ data: { name: DEFAULT_ORG_NAME } });
  console.log('Default org:', org.id, `(${org.name})`);

  for (const m of MODELS) {
    const res = await prisma[m].updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id },
    });
    console.log(`  ${m}: ${res.count} ta qator yangilandi`);
  }
  console.log('Backfill tugadi ✅');
};

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
