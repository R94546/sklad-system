import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { success, error } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';
import prisma from '../../config/db.js';

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
    await audit(req.user.id, 'CATEGORY_CREATE', 'Category', data.id, null, { name: data.name }, req);
    return success(res, data, 'Создано', 201);
  } catch (err) { next(err); }
});

router.put('/:id', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const data = await prisma.category.update({ where: { id: req.params.id }, data: { name: req.body.name } });
    await audit(req.user.id, 'CATEGORY_UPDATE', 'Category', req.params.id, null, { name: data.name }, req);
    return success(res, data, 'Обновлено');
  } catch (err) { next(err); }
});

router.delete('/:id', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const products = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (products > 0) return error(res, 'В этой категории есть товары', 400);
    await prisma.category.delete({ where: { id: req.params.id } });
    await audit(req.user.id, 'CATEGORY_DELETE', 'Category', req.params.id, null, null, req);
    return success(res, null, 'Удалено');
  } catch (err) { next(err); }
});

export default router;
