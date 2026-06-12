import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { success } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, entity, userId, action, dateFrom, dateTo } = req.query;
    const createdAt = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59, 999); createdAt.lte = to; }
    const where = {
      ...(entity && { entity }),
      ...(userId && { userId }),
      ...(action && { action }),
      ...((dateFrom || dateTo) && { createdAt }),
    };
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, imageUrl: true, role: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return success(res, { data, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

export default router;
