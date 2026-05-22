import { Router } from 'express';
import { getAll, getById, create, cancel } from './sales.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id/cancel', roleMiddleware('ADMIN'), cancel);

export default router;
