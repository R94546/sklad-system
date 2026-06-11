import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import env from "../../config/env.js";
import { audit } from "../../utils/audit.js";

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
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

export const login = async (phone, password, req = null) => {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.isActive) throw { status: 401, message: "Пользователь не найден" };
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw { status: 401, message: "Неверный пароль" };
  const tokens = generateTokens(user);
  await prisma.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id } });
  await audit(user.id, "LOGIN", "User", user.id, null, null, req);
  return { ...tokens, user: { id: user.id, name: user.name, role: user.role, phone: user.phone, maxDiscountPercent: user.maxDiscountPercent, canEditPrice: user.canEditPrice } };
};

export const refresh = async (token) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored) throw { status: 401, message: "Токен не найден" };
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    const tokens = generateTokens(user);
    await prisma.refreshToken.delete({ where: { token } });
    await prisma.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id } });
    return tokens;
  } catch {
    throw { status: 401, message: "Недействительный токен" };
  }
};

export const logout = async (token) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const forceLogout = async (userId) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};
