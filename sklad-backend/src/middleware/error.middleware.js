import { error } from '../utils/response.js';

export const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || 500;
  const message = err.message || 'Server xatosi';
  return error(res, message, statusCode);
};
