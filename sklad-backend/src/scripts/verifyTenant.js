import 'dotenv/config';
import prisma, { rawPrisma } from '../config/db.js';
import { tenantContext } from '../config/tenant.js';

// Проверка изоляции арендаторов: создаёт временный склад B, проверяет, что
// склады A и B не видят данные друг друга, затем всё подчищает.
// ВАЖНО: await ВНУТРИ run-колбэка, иначе ALS-контекст не доживёт до выполнения
// запроса (в приложении это гарантирует Express: handler await-ит внутри next()).
const asOrg = (orgId, fn) => tenantContext.run({ organizationId: orgId }, fn);

// Удаляет любые тестовые артефакты (в т.ч. от прошлого упавшего запуска).
const purge = async () => {
  await rawPrisma.product.deleteMany({ where: { name: { startsWith: '__TEST_P_' } } });
  await rawPrisma.category.deleteMany({ where: { name: { startsWith: '__test_cat_' } } });
  const testOrgs = await rawPrisma.organization.findMany({ where: { name: '__TEST_ORG_B__' }, select: { id: true } });
  for (const o of testOrgs) {
    await rawPrisma.product.deleteMany({ where: { organizationId: o.id } });
    await rawPrisma.category.deleteMany({ where: { organizationId: o.id } });
    await rawPrisma.settings.deleteMany({ where: { organizationId: o.id } });
    await rawPrisma.user.deleteMany({ where: { organizationId: o.id } });
    await rawPrisma.organization.delete({ where: { id: o.id } });
  }
};

const run = async () => {
  await purge(); // на случай мусора от прошлого запуска

  const orgA = await rawPrisma.organization.findFirst({ where: { name: 'Asosiy sklad' } });
  if (!orgA) throw new Error('Asosiy sklad topilmadi (avval backfill ishga tushiring)');

  const orgB = await rawPrisma.organization.create({ data: { name: '__TEST_ORG_B__' } });
  let catA = await rawPrisma.category.findFirst({ where: { organizationId: orgA.id, name: { not: { startsWith: '__test_cat_' } } } });
  if (!catA) catA = await rawPrisma.category.create({ data: { name: '__test_cat_a__', organizationId: orgA.id } });
  const catB = await rawPrisma.category.create({ data: { name: '__test_cat_b__', organizationId: orgB.id } });

  const pA = await asOrg(orgA.id, async () => await prisma.product.create({ data: { name: '__TEST_P_A__', categoryId: catA.id, buyPrice: 1, sellPrice: 2 } }));
  const pB = await asOrg(orgB.id, async () => await prisma.product.create({ data: { name: '__TEST_P_B__', categoryId: catB.id, buyPrice: 1, sellPrice: 2 } }));

  const r = {};

  await asOrg(orgA.id, async () => {
    const list = await prisma.product.findMany({ where: { name: { startsWith: '__TEST_P_' } } });
    r['A: findMany faqat A ni ko‘radi'] = list.some((p) => p.id === pA.id) && !list.some((p) => p.id === pB.id);
    r['A: create org ni avto yozdi'] = pA.organizationId === orgA.id;
  });

  await asOrg(orgA.id, async () => {
    const cross = await prisma.product.findUnique({ where: { id: pB.id } });
    r['A: B ning findUnique null'] = cross === null;
    const own = await prisma.product.findUnique({ where: { id: pA.id } });
    r['A: o‘zining findUnique ishlaydi'] = own?.id === pA.id;
  });

  await asOrg(orgA.id, async () => {
    let blocked = false;
    try { await prisma.product.update({ where: { id: pB.id }, data: { name: 'HACKED' } }); }
    catch { blocked = true; }
    r['A: B ni update qila olmaydi (extendedWhereUnique)'] = blocked;
  });

  const pBafter = await rawPrisma.product.findUnique({ where: { id: pB.id } });
  r['B: ma‘lumot o‘zgarmagan'] = pBafter?.name === '__TEST_P_B__';

  await asOrg(orgB.id, async () => {
    const list = await prisma.product.findMany({ where: { name: { startsWith: '__TEST_P_' } } });
    r['B: faqat B ni ko‘radi'] = list.length === 1 && list[0].id === pB.id;
  });

  let noCtxThrew = false;
  try { await prisma.product.findMany(); } catch { noCtxThrew = true; }
  r['Kontekstsiz so‘rov bloklanadi (fail-closed)'] = noCtxThrew;

  console.log('\n=== Tenant izolyatsiya testi ===');
  for (const [k, v] of Object.entries(r)) console.log(`  ${v ? '✅' : '❌'}  ${k}`);
  const allPass = Object.values(r).every(Boolean);
  console.log(`\n${allPass ? '✅ HAMMASI O‘TDI' : '❌ XATOLIK BOR'}\n`);
  return allPass;
};

run()
  .then((ok) => purge().then(() => process.exit(ok ? 0 : 1)))
  .catch((e) => { console.error(e); purge().finally(() => process.exit(1)); });
