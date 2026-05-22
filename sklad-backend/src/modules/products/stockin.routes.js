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
    const { productId, page = 1, limit = 20 } = req.query;
    const where = { ...(productId && { productId }) };
    const [data, total] = await Promise.all([
      prisma.stockIn.findMany({
        where,
        include: { product: { select: { name: true, unit: true } }, user: { select: { name: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockIn.count({ where }),
    ]);
    return success(res, { data, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { productId, quantity, price, note } = req.body;
    const qty = parseInt(quantity);
    const result = await prisma.$transaction(async (tx) => {      const stockIn = await tx.stockIn.create({
        data: { productId, quantity: qty, price: Number(price), note: note || null, userId: req.user.id },
        include: { product: { select: { name: true } } },
      });
      await tx.product.update({
        where: { id: productId },
        data: { quantity: { increment: qty }, buyPrice: Number(price) },
      });
      return stockIn;
    });
    return success(res, result, 'Kirim amalga oshirildi', 201);
  } catch (err) { next(err); }
});

export default router;
