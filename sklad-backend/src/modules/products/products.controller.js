import * as productsService from './products.service.js';
import { success, error } from '../../utils/response.js';
export const getAll = async (req, res, next) => {
  try {
    const data = await productsService.getAll(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};
export const getById = async (req, res, next) => {
  try {
    const data = await productsService.getById(req.params.id);
    if (!data) return error(res, 'Topilmadi', 404);
    return success(res, data);
  } catch (err) { next(err); }
};
export const create = async (req, res, next) => {
  try {
    const data = await productsService.create(req.body, req.file);
    return success(res, data, 'Yaratildi', 201);
  } catch (err) { next(err); }
};
export const update = async (req, res, next) => {
  try {
    const data = await productsService.update(req.params.id, req.body, req.file);
    return success(res, data, 'Yangilandi');
  } catch (err) { next(err); }
};
export const remove = async (req, res, next) => {
  try {
    await productsService.remove(req.params.id);
    return success(res, null, 'Ochirildi');
  } catch (err) { next(err); }
};
export const getLowStock = async (req, res, next) => {
  try {
    const data = await productsService.getLowStock();
    return success(res, data);
  } catch (err) { next(err); }
};
