import 'dotenv/config';
import { rawPrisma } from '../config/db.js';

// HTTP e2e: проверяет, что весь путь запроса (Express → authMiddleware →
// tenantContext.run → Prisma extension) изолирует данные по складу.
const BASE = process.env.SMOKE_BASE || 'http://localhost:5000/api';
const SA_PHONE = process.argv[2] || '+998900000000';
const SA_PASS = process.argv[3] || 'SkladSuper2026';

const post = async (path, body, token) => {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const get = async (path, token) => {
  const res = await fetch(BASE + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status, json: await res.json().catch(() => null) };
};

const run = async () => {
  const r = {};

  // 1. super-admin login
  const saLogin = await post('/auth/login', { phone: SA_PHONE, password: SA_PASS });
  const saToken = saLogin.json?.data?.accessToken;
  r['Super-admin login (role=SUPER_ADMIN)'] = saLogin.status === 200 && saLogin.json?.data?.user?.role === 'SUPER_ADMIN';

  // 2. список складов
  const orgs = await get('/admin/organizations', saToken);
  r['Super-admin skladlar ro‘yxatini oladi'] = orgs.status === 200 && Array.isArray(orgs.json?.data);

  // 3. super-admin НЕ может читать товары (нет org → fail-closed)
  const saProducts = await get('/products', saToken);
  r['Super-admin tovarlarni ko‘ra olmaydi (fail-closed)'] = saProducts.status === 401;

  // 4. создать новый склад + админ
  const created = await post('/admin/organizations', {
    name: '__HTTP_TEST__', adminName: 'HTTP Admin', adminPhone: '+998900000111', adminPassword: 'test1234',
  }, saToken);
  r['Yangi sklad yaratildi'] = created.status === 201;

  // 5. login новым админом
  const adminLogin = await post('/auth/login', { phone: '+998900000111', password: 'test1234' });
  const adminToken = adminLogin.json?.data?.accessToken;
  r['Yangi admin login + org token'] = adminLogin.status === 200 && !!adminLogin.json?.data?.user?.organizationId;

  // 6. товары нового склада ПУСТЫ (изоляция от «Asosiy sklad»)
  const prod = await get('/products', adminToken);
  const total = prod.json?.data?.total ?? prod.json?.data?.data?.length;
  r['Yangi sklad tovarlari BO‘SH (izolyatsiya)'] = prod.status === 200 && (total === 0);

  console.log('\n=== HTTP e2e izolyatsiya testi ===');
  for (const [k, v] of Object.entries(r)) console.log(`  ${v ? '✅' : '❌'}  ${k}`);
  const allPass = Object.values(r).every(Boolean);
  console.log(`\n${allPass ? '✅ HAMMASI O‘TDI' : '❌ XATOLIK BOR'}\n`);
  return allPass;
};

const cleanup = async () => {
  const orgs = await rawPrisma.organization.findMany({ where: { name: '__HTTP_TEST__' }, select: { id: true } });
  for (const o of orgs) {
    await rawPrisma.settings.deleteMany({ where: { organizationId: o.id } });
    await rawPrisma.user.deleteMany({ where: { organizationId: o.id } });
    await rawPrisma.organization.delete({ where: { id: o.id } });
  }
};

run()
  .then((ok) => cleanup().then(() => process.exit(ok ? 0 : 1)))
  .catch((e) => { console.error(e); cleanup().finally(() => process.exit(1)); });
