import { Router } from 'express';
import { getAll, getById, create, update, remove, getLowStock } from './products.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/low-stock', roleMiddleware('ADMIN'), getLowStock);
router.get('/:id', getById);
router.post('/', roleMiddleware('ADMIN'), create);
router.put('/:id', roleMiddleware('ADMIN'), update);
router.delete('/:id', roleMiddleware('ADMIN'), remove);

export default router;
