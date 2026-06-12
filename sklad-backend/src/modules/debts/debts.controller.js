import * as debtsService from './debts.service.js';
import { success, error } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await debtsService.getAll(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const data = await debtsService.getById(req.params.id);
    if (!data) return error(res, 'Не найдено', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

export const pay = async (req, res, next) => {
  try {
    const data = await debtsService.pay(req.params.id, req.body.amount);
    await audit(req.user.id, 'DEBT_PAY', 'Debt', req.params.id, null, { amount: req.body.amount }, req);
    return success(res, data, 'Оплата принята');
  } catch (err) { next(err); }
};

export const getOverdue = async (req, res, next) => {
  try {
    const data = await debtsService.getOverdue();
    return success(res, data);
  } catch (err) { next(err); }
};
