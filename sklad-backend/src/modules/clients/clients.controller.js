import * as clientsService from './clients.service.js';
import { success, error } from '../../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await clientsService.getAll(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const data = await clientsService.getById(req.params.id);
    if (!data) return error(res, 'Topilmadi', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await clientsService.create(req.body);
    return success(res, data, 'Yaratildi', 201);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const data = await clientsService.update(req.params.id, req.body);
    return success(res, data, 'Yangilandi');
  } catch (err) { next(err); }
};

export const block = async (req, res, next) => {
  try {
    const data = await clientsService.block(req.params.id, req.body.isBlocked);
    return success(res, data, 'Yangilandi');
  } catch (err) { next(err); }
};
