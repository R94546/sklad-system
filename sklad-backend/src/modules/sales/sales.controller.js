import * as salesService from './sales.service.js';
import { success, error } from '../../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await salesService.getAll(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const data = await salesService.getById(req.params.id);
    if (!data) return error(res, 'Topilmadi', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await salesService.create(req.body, req.user.id);
    return success(res, data, 'Sotuv amalga oshirildi', 201);
  } catch (err) { next(err); }
};

export const cancel = async (req, res, next) => {
  try {
    const data = await salesService.cancel(req.params.id);
    return success(res, data, 'Bekor qilindi');
  } catch (err) { next(err); }
};
