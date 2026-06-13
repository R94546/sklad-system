import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../middleware/superadmin.middleware.js';
import * as ctrl from './superadmin.controller.js';

const router = Router();
router.use(authMiddleware, requireSuperAdmin);

router.get('/organizations', ctrl.list);
router.post('/organizations', ctrl.create);
router.patch('/organizations/:id/active', ctrl.setActive);

export default router;
