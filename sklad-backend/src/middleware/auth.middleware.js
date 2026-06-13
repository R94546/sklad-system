import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { error } from '../utils/response.js';
import { tenantContext } from '../config/tenant.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Токен не найден', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    // Устанавливаем org-контекст на всю обработку запроса: Prisma-extension
    // автоматически ограничит все запросы этим складом.
    tenantContext.run({ organizationId: decoded.organizationId ?? null }, () => next());
  } catch {
    return error(res, 'Недействительный токен', 401);
  }
};
