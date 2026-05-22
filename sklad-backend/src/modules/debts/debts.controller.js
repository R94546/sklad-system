import * as debtsService from './debts.service.js';
import { success, error } from '../../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await debtsService.getAll(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const data = await debtsService.getById(req.params.id);
    if (!data) return error(res, 'Topilmadi', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

export const pay = async (req, res, next) => {
  try {
    const data = await debtsService.pay(req.params.id, req.body.amount);
    return success(res, data, 'Tolov qabul qilindi');
  } catch (err) { next(err); }
};

export const getOverdue = async (req, res, next) => {
  try {
    const data = await debtsService.getOverdue();
    return success(res, data);
  } catch (err) { next(err); }
};
