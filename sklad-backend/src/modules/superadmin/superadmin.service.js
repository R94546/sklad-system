import bcrypt from 'bcryptjs';
import { rawPrisma as prisma } from '../../config/db.js';

// Супер-админ управляет складами через rawPrisma (без org-фильтра): видит все
// организации и создаёт новых арендаторов вместе с их первым админом.

export const listOrganizations = async () => {
  return prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, products: true, sales: true } },
      users: {
        where: { role: 'ADMIN' },
        select: { id: true, name: true, phone: true, isActive: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

export const createOrganization = async ({ name, adminName, adminPhone, adminPassword }) => {
  if (!name?.trim()) throw { status: 400, message: "Sklad nomini kiriting" };
  if (!adminName?.trim()) throw { status: 400, message: "Admin ismini kiriting" };
  if (!adminPhone?.trim()) throw { status: 400, message: "Admin telefonini kiriting" };
  if (!adminPassword || adminPassword.length < 4) throw { status: 400, message: "Parol kamida 4 ta belgi bo'lsin" };

  const phone = adminPhone.trim();
  const dup = await prisma.user.findUnique({ where: { phone } });
  if (dup) throw { status: 400, message: "Bu telefon raqami allaqachon band" };

  const hashed = await bcrypt.hash(adminPassword, 10);
  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: name.trim() } });
    const admin = await tx.user.create({
      data: { name: adminName.trim(), phone, password: hashed, role: 'ADMIN', organizationId: org.id },
      select: { id: true, name: true, phone: true, role: true },
    });
    // стартовые настройки склада
    await tx.settings.create({ data: { organizationId: org.id, companyName: name.trim() } });
    return { ...org, admin };
  });
};

export const setOrganizationActive = async (id, isActive) => {
  const active = Boolean(isActive);
  const org = await prisma.organization.update({ where: { id }, data: { isActive: active } });
  // При блокировке разлогиниваем всех пользователей склада (чистим refresh-токены)
  if (!active) {
    const users = await prisma.user.findMany({ where: { organizationId: id }, select: { id: true } });
    if (users.length) {
      await prisma.refreshToken.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
    }
  }
  return org;
};
