import * as clientsService from './clients.service.js';
import { success, error } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await clientsService.getAll(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const data = await clientsService.getById(req.params.id);
    if (!data) return error(res, 'Не найдено', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await clientsService.create(req.body);
    await audit(req.user.id, 'CLIENT_CREATE', 'Client', data.id, null, { name: data.name, phone: data.phone }, req);
    return success(res, data, 'Создано', 201);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const data = await clientsService.update(req.params.id, req.body);
    await audit(req.user.id, 'CLIENT_UPDATE', 'Client', req.params.id, null, { name: data.name }, req);
    return success(res, data, 'Обновлено');
  } catch (err) { next(err); }
};

export const block = async (req, res, next) => {
  try {
    const data = await clientsService.block(req.params.id, req.body.isBlocked);
    await audit(req.user.id, req.body.isBlocked ? 'CLIENT_BLOCK' : 'CLIENT_UNBLOCK', 'Client', req.params.id, null, null, req);
    return success(res, data, 'Обновлено');
  } catch (err) { next(err); }
};
