import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rawPrisma as prisma } from "../../config/db.js";
import env from "../../config/env.js";
import { audit } from "../../utils/audit.js";

// login/refresh выполняются ДО установки org-контекста (публичный роут), поэтому
// используем rawPrisma: ищем пользователя по телефону/id без org-фильтра.

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name, organizationId: user.organizationId ?? null },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
};

// SUPER_ADMIN живёт вне организаций; остальные могут входить только если их склад активен.
const assertActive = (user) => {
  if (!user || !user.isActive) throw { status: 401, message: "Пользователь не найден" };
  if (user.role !== "SUPER_ADMIN" && !(user.organization && user.organization.isActive)) {
    throw { status: 403, message: "Sklad faol emas yoki bloklangan. Administrator bilan bog'laning." };
  }
};

export const login = async (phone, password, req = null) => {
  const user = await prisma.user.findUnique({ where: { phone }, include: { organization: true } });
  if (!user || !user.isActive) throw { status: 401, message: "Пользователь не найден" };
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw { status: 401, message: "Неверный пароль" };
  assertActive(user);
  const tokens = generateTokens(user);
  await prisma.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id } });
  await audit(user.id, "LOGIN", "User", user.id, null, null, req);
  return {
    ...tokens,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      organizationId: user.organizationId ?? null,
      organizationName: user.organization?.name ?? null,
      maxDiscountPercent: user.maxDiscountPercent,
      canEditPrice: user.canEditPrice,
    },
  };
};

export const refresh = async (token) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored) throw { status: 401, message: "Токен не найден" };
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, include: { organization: true } });
    assertActive(user);
    const tokens = generateTokens(user);
    await prisma.refreshToken.delete({ where: { token } });
    await prisma.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id } });
    return tokens;
  } catch (e) {
    if (e && e.status) throw e; // проброс «склад заблокирован»/«не найден»
    throw { status: 401, message: "Недействительный токен" };
  }
};

export const logout = async (token) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const forceLogout = async (userId) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};
