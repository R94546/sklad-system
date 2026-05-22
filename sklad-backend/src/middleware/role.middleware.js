import { error } from '../utils/response.js';

export const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, 'Ruxsat yoq', 403);
    }
    next();
  };
};
