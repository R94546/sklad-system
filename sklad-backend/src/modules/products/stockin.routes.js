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
    const priceNum = Number(price);
    // Валидация: иначе NaN испортит остаток/цену товара
    if (!productId) throw { status: 400, message: 'Выберите товар' };
    if (!Number.isFinite(qty) || qty <= 0) throw { status: 400, message: 'Количество должно быть больше 0' };
    if (!Number.isFinite(priceNum) || priceNum < 0) throw { status: 400, message: 'Некорректная цена прихода' };

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw { status: 404, message: 'Товар не найден' };
      const stockIn = await tx.stockIn.create({
        data: { productId, quantity: qty, price: priceNum, note: note || null, userId: req.user.id },
        include: { product: { select: { name: true } } },
      });
      await tx.product.update({
        where: { id: productId },
        data: { quantity: { increment: qty }, buyPrice: priceNum },
      });
      return stockIn;
    });
    return success(res, result, 'Приход оформлен', 201);
  } catch (err) { next(err); }
});

export default router;
