import { Router } from 'express';
import { getAll, getById, pay, getOverdue } from './debts.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/overdue', roleMiddleware('ADMIN'), getOverdue);
router.get('/:id', getById);
router.patch('/:id/pay', pay);

export default router;
