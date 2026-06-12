import * as salesService from './sales.service.js';
import { remove, updateSale, getCart, getCarts, createCart, addToCart, removeFromCart, confirmCart } from './sales.service.js';
import { success, error } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await salesService.getAll(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const data = await salesService.getById(req.params.id);
    if (!data) return error(res, 'Не найдено', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await salesService.create(req.body, req.user.id);
    await audit(req.user.id, 'SALE_CONFIRM', 'Sale', data.id, null, { number: data.number, total: data.totalAmount, paymentType: data.paymentType }, req);
    return success(res, data, 'Продажа оформлена', 201);
  } catch (err) { next(err); }
};

export const cancel = async (req, res, next) => {
  try {
    const data = await salesService.cancel(req.params.id);
    await audit(req.user.id, 'SALE_CANCEL', 'Sale', req.params.id, null, null, req);
    return success(res, data, 'Отменено');
  } catch (err) { next(err); }
};
export const deleteSale = async (req, res, next) => { try { const data = await remove(req.params.id); await audit(req.user.id, 'SALE_DELETE', 'Sale', req.params.id, null, null, req); return success(res, data); } catch (err) { next(err); } };
export const editSale = async (req, res, next) => { try { const data = await updateSale(req.params.id, req.body); return success(res, data); } catch (err) { next(err); } };


export const getCartHandler = async (req, res, next) => { try { const data = await getCart(req.user.id); return success(res, data); } catch (err) { next(err); } };
export const getCartsHandler = async (req, res, next) => { try { const data = await getCarts(req.user.id); return success(res, data); } catch (err) { next(err); } };
export const createCartHandler = async (req, res, next) => { try { const data = await createCart(req.user.id); return success(res, data, 'Новый чек', 201); } catch (err) { next(err); } };
export const addToCartHandler = async (req, res, next) => { try { const data = await addToCart(req.user.id, req.body.productId, req.body.quantity || 1, req.body.price, req.body.saleId); return success(res, data); } catch (err) { next(err); } };
export const removeFromCartHandler = async (req, res, next) => { try { const data = await removeFromCart(req.user.id, req.params.itemId); return success(res, data); } catch (err) { next(err); } };
export const confirmCartHandler = async (req, res, next) => { try { const data = await confirmCart(req.params.id, req.body); await audit(req.user.id, 'SALE_CONFIRM', 'Sale', data.id, null, { number: data.number, total: data.totalAmount, paymentType: data.paymentType }, req); return success(res, data); } catch (err) { next(err); } };

export const updateCartItemHandler = async (req, res, next) => {
  try {
    const data = await salesService.updateCartItem(req.user.id, req.params.itemId, req.body.quantity, req.body.price);
    return success(res, data, 'Обновлено');
  } catch (err) { next(err); }
};

