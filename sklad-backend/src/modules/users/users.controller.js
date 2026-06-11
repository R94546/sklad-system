import * as usersService from './users.service.js';
import { success, error } from '../../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await usersService.getAll();
    return success(res, data);
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const data = await usersService.getById(req.params.id);
    if (!data) return error(res, 'Topilmadi', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await usersService.create(req.body);
    return success(res, data, 'Создано', 201);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const data = await usersService.update(req.params.id, req.body);
    return success(res, data, 'Yangilandi');
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    await usersService.remove(req.params.id);
    return success(res, null, 'Удалено');
  } catch (err) { next(err); }
};
