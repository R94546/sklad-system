import { Router } from 'express';
import { getAll, getById, create, cancel, deleteSale, editSale, getCartHandler, getCartsHandler, createCartHandler, addToCartHandler, removeFromCartHandler, updateCartItemHandler, confirmCartHandler } from './sales.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id/cancel', roleMiddleware('ADMIN'), cancel);
router.delete('/:id', roleMiddleware('ADMIN'), deleteSale);
router.put('/:id', roleMiddleware('ADMIN'), editSale);
router.get('/cart/my', getCartHandler);
router.get('/cart/all', getCartsHandler);
router.post('/cart/new', createCartHandler);
router.post('/cart/add', addToCartHandler);
router.delete('/cart/item/:itemId', removeFromCartHandler);
router.patch('/cart/item/:itemId', updateCartItemHandler);
router.post('/cart/:id/confirm', confirmCartHandler);

export default router;




