import * as productsService from './products.service.js';
import { success, error } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';
export const getAll = async (req, res, next) => {
  try {
    const data = await productsService.getAll(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};
export const getById = async (req, res, next) => {
  try {
    const data = await productsService.getById(req.params.id);
    if (!data) return error(res, 'Не найдено', 404);
    return success(res, data);
  } catch (err) { next(err); }
};
export const create = async (req, res, next) => {
  try {
    const data = await productsService.create(req.body, req.file);
    await audit(req.user.id, 'PRODUCT_CREATE', 'Product', data.id, null, { name: data.name }, req);
    return success(res, data, 'Создано', 201);
  } catch (err) { next(err); }
};
export const update = async (req, res, next) => {
  try {
    const data = await productsService.update(req.params.id, req.body, req.file);
    await audit(req.user.id, 'PRODUCT_UPDATE', 'Product', req.params.id, null, { name: data.name }, req);
    return success(res, data, 'Обновлено');
  } catch (err) { next(err); }
};
export const remove = async (req, res, next) => {
  try {
    await productsService.remove(req.params.id);
    await audit(req.user.id, 'PRODUCT_DELETE', 'Product', req.params.id, null, null, req);
    return success(res, null, 'Удалено');
  } catch (err) { next(err); }
};
export const getLowStock = async (req, res, next) => {
  try {
    const data = await productsService.getLowStock();
    return success(res, data);
  } catch (err) { next(err); }
};
