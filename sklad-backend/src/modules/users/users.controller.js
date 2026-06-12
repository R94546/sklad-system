import * as usersService from './users.service.js';
import { success, error } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';

const snapshot = (u) => u ? {
  name: u.name, phone: u.phone, role: u.role, isActive: u.isActive,
  maxDiscountPercent: u.maxDiscountPercent, canEditPrice: u.canEditPrice, imageUrl: u.imageUrl || null,
} : null;

export const getAll = async (req, res, next) => {
  try {
    const data = await usersService.getAll();
    return success(res, data);
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const data = await usersService.getById(req.params.id);
    if (!data) return error(res, 'Не найдено', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await usersService.create(req.body);
    await audit(req.user.id, 'USER_CREATE', 'User', data.id, null, snapshot(data), req);
    return success(res, data, 'Создано', 201);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const before = await usersService.getById(req.params.id);
    const data = await usersService.update(req.params.id, req.body);
    const newData = snapshot(data);
    if (req.body.password) newData.passwordChanged = true;
    await audit(req.user.id, 'USER_UPDATE', 'User', req.params.id, snapshot(before), newData, req);
    return success(res, data, 'Обновлено');
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const before = await usersService.getById(req.params.id);
    await usersService.remove(req.params.id);
    await audit(req.user.id, 'USER_DELETE', 'User', req.params.id, snapshot(before), null, req);
    return success(res, null, 'Удалено');
  } catch (err) { next(err); }
};
