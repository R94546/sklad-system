import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { success, error } from '../../utils/response.js';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const data = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return success(res, data);
  } catch (err) { next(err); }
});

router.post('/', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const data = await prisma.category.create({ data: { name: req.body.name } });
    return success(res, data, 'Yaratildi', 201);
  } catch (err) { next(err); }
});

router.put('/:id', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const data = await prisma.category.update({ where: { id: req.params.id }, data: { name: req.body.name } });
    return success(res, data, 'Yangilandi');
  } catch (err) { next(err); }
});

router.delete('/:id', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const products = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (products > 0) return error(res, 'Bu kategoriyada mahsulotlar bor', 400);
    await prisma.category.delete({ where: { id: req.params.id } });
    return success(res, null, 'Ochirildi');
  } catch (err) { next(err); }
});

export default router;
