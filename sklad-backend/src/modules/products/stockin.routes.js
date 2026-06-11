import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { success } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';
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
      const oldQty = product.quantity;
      const oldBuy = Number(product.buyPrice);
      // Средневзвешенная закупочная цена (если был положительный остаток)
      const newBuy = oldQty > 0 ? (oldQty * oldBuy + qty * priceNum) / (oldQty + qty) : priceNum;
      const stockIn = await tx.stockIn.create({
        data: { productId, quantity: qty, price: priceNum, note: note || null, userId: req.user.id },
        include: { product: { select: { name: true } } },
      });
      await tx.product.update({
        where: { id: productId },
        data: { quantity: { increment: qty }, buyPrice: newBuy },
      });
      return stockIn;
    });
    await audit(req.user.id, 'STOCK_IN', 'StockIn', result.id, null, { productId, quantity: qty, price: priceNum }, req);
    return success(res, result, 'Приход оформлен', 201);
  } catch (err) { next(err); }
});

// Правка прихода (корректирует остаток на разницу; buyPrice не пересчитывается)
router.put('/:id', async (req, res, next) => {
  try {
    const { quantity, price, note } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const old = await tx.stockIn.findUnique({ where: { id: req.params.id } });
      if (!old) throw { status: 404, message: 'Приход не найден' };
      const newQty = quantity !== undefined ? parseInt(quantity) : old.quantity;
      const newPrice = price !== undefined ? Number(price) : Number(old.price);
      if (!Number.isFinite(newQty) || newQty <= 0) throw { status: 400, message: 'Количество должно быть больше 0' };
      if (!Number.isFinite(newPrice) || newPrice < 0) throw { status: 400, message: 'Некорректная цена' };

      const delta = newQty - old.quantity;
      if (delta < 0) {
        // Уменьшение — атомарно, без ухода остатка в минус
        const upd = await tx.product.updateMany({
          where: { id: old.productId, quantity: { gte: -delta } },
          data: { quantity: { increment: delta } },
        });
        if (upd.count === 0) throw { status: 400, message: 'Нельзя уменьшить: товар уже продан (остаток меньше разницы)' };
      } else if (delta > 0) {
        await tx.product.update({ where: { id: old.productId }, data: { quantity: { increment: delta } } });
      }
      const updated = await tx.stockIn.update({
        where: { id: req.params.id },
        data: { quantity: newQty, price: newPrice, note: note !== undefined ? (note || null) : old.note },
        include: { product: { select: { name: true } } },
      });
      return { old, updated };
    });
    await audit(req.user.id, 'STOCK_EDIT', 'StockIn', req.params.id, result.old, result.updated, req);
    return success(res, result.updated, 'Приход обновлён');
  } catch (err) { next(err); }
});

// Удаление прихода (откатывает остаток; buyPrice не пересчитывается)
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const stockIn = await tx.stockIn.findUnique({ where: { id: req.params.id } });
      if (!stockIn) throw { status: 404, message: 'Приход не найден' };
      const upd = await tx.product.updateMany({
        where: { id: stockIn.productId, quantity: { gte: stockIn.quantity } },
        data: { quantity: { decrement: stockIn.quantity } },
      });
      if (upd.count === 0) throw { status: 400, message: 'Нельзя удалить: товар уже продан (остаток меньше прихода)' };
      await tx.stockIn.delete({ where: { id: req.params.id } });
      return stockIn;
    });
    await audit(req.user.id, 'STOCK_DELETE', 'StockIn', result.id, result, null, req);
    return success(res, { success: true }, 'Приход удалён');
  } catch (err) { next(err); }
});

export default router;
