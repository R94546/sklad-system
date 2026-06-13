import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { success } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();
router.use(authMiddleware);

// Настройки — по одной строке на склад. org подставляется автоматически (tenant extension),
// поэтому findFirst/create/update всегда работают в пределах текущей организации.
router.get('/', async (req, res, next) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) settings = await prisma.settings.create({ data: {} });
    return success(res, settings);
  } catch (err) { next(err); }
});

router.put('/', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const { companyName, companyPhone, companyAddress, currency, taxPercent, smsTemplate, reminderDays } = req.body;
    const data = {
      ...(companyName && { companyName }),
      ...(companyPhone !== undefined && { companyPhone }),
      ...(companyAddress !== undefined && { companyAddress }),
      ...(currency && { currency }),
      ...(taxPercent !== undefined && { taxPercent: Number(taxPercent) }),
      ...(smsTemplate && { smsTemplate }),
      ...(reminderDays !== undefined && { reminderDays: parseInt(reminderDays) }),
    };
    const existing = await prisma.settings.findFirst();
    const settings = existing
      ? await prisma.settings.update({ where: { id: existing.id }, data })
      : await prisma.settings.create({ data });
    return success(res, settings, 'Sozlamalar saqlandi');
  } catch (err) { next(err); }
});

export default router;
