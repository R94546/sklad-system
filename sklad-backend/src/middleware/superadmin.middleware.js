import { error } from '../utils/response.js';

// Доступ только для платформенного супер-админа (вне организаций).
export const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'SUPER_ADMIN') return error(res, 'Доступ запрещён', 403);
  next();
};
