import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { success } from '../../utils/response.js';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const router = Router();
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, entity, userId } = req.query;
    const where = {
      ...(entity && { entity }),
      ...(userId && { userId }),
    };
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true } } },
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
