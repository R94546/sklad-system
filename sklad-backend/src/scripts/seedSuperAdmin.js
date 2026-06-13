import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { rawPrisma as prisma } from '../config/db.js';

// Создаёт (или обновляет) платформенного супер-админа — вне организаций.
// Использование: node src/scripts/seedSuperAdmin.js <phone> <password> [name]
//   или через env: SUPERADMIN_PHONE, SUPERADMIN_PASSWORD, SUPERADMIN_NAME
const run = async () => {
  const phone = process.argv[2] || process.env.SUPERADMIN_PHONE;
  const password = process.argv[3] || process.env.SUPERADMIN_PASSWORD;
  const name = process.argv[4] || process.env.SUPERADMIN_NAME || 'Super Admin';

  if (!phone || !password) {
    console.error('Foydalanish: node src/scripts/seedSuperAdmin.js <phone> <password> [name]');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    await prisma.user.update({
      where: { phone },
      data: { role: 'SUPER_ADMIN', password: hashed, isActive: true, organizationId: null, name },
    });
    console.log('Super-admin yangilandi:', phone);
  } else {
    await prisma.user.create({
      data: { name, phone, password: hashed, role: 'SUPER_ADMIN', organizationId: null },
    });
    console.log('Super-admin yaratildi:', phone);
  }
};

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
