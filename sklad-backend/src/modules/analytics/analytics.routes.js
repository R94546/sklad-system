import { Router } from 'express';
import { getDashboard, getSalesChart, getTopProducts, getSellerStats } from './analytics.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/dashboard', getDashboard);
router.get('/sales-chart', getSalesChart);
router.get('/top-products', getTopProducts);
router.get('/sellers', getSellerStats);

export default router;
