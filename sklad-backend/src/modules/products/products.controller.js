import * as productsService from './products.service.js';
import { success, error } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';

// Снимок товара для журнала: только значимые поля, Decimal → число
const snapshot = (p) => p ? {
  name: p.name, barcode: p.barcode || null, category: p.category?.name,
  buyPrice: Number(p.buyPrice), sellPrice: Number(p.sellPrice),
  quantity: Number(p.quantity), minStock: Number(p.minStock), unit: p.unit,
  imageUrl: p.imageUrl || null,
} : null;
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
    await audit(req.user.id, 'PRODUCT_CREATE', 'Product', data.id, null, snapshot(data), req);
    return success(res, data, 'Создано', 201);
  } catch (err) { next(err); }
};
export const update = async (req, res, next) => {
  try {
    const before = await productsService.getById(req.params.id);
    const data = await productsService.update(req.params.id, req.body, req.file);
    await audit(req.user.id, 'PRODUCT_UPDATE', 'Product', req.params.id, snapshot(before), snapshot(data), req);
    return success(res, data, 'Обновлено');
  } catch (err) { next(err); }
};
export const remove = async (req, res, next) => {
  try {
    const before = await productsService.getById(req.params.id);
    await productsService.remove(req.params.id);
    await audit(req.user.id, 'PRODUCT_DELETE', 'Product', req.params.id, snapshot(before), null, req);
    return success(res, null, 'Удалено');
  } catch (err) { next(err); }
};
export const inventory = async (req, res, next) => {
  try {
    const adjustments = await productsService.inventory(req.body.items);
    for (const a of adjustments) {
      await audit(req.user.id, 'INVENTORY_ADJUST', 'Product', a.productId, { quantity: a.oldQty }, { quantity: a.newQty, diff: a.diff }, req);
    }
    return success(res, adjustments, 'Инвентаризация применена');
  } catch (err) { next(err); }
};
export const getLowStock = async (req, res, next) => {
  try {
    const data = await productsService.getLowStock();
    return success(res, data);
  } catch (err) { next(err); }
};
