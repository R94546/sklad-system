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

router.get('/', async (req, res, next) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: '1' } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: '1' } });
    }
    return success(res, settings);
  } catch (err) { next(err); }
});

router.put('/', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const { companyName, companyPhone, companyAddress, currency, taxPercent, smsTemplate, reminderDays } = req.body;
    const settings = await prisma.settings.upsert({
      where: { id: '1' },
      update: {
        ...(companyName && { companyName }),
        ...(companyPhone !== undefined && { companyPhone }),
        ...(companyAddress !== undefined && { companyAddress }),
        ...(currency && { currency }),
        ...(taxPercent !== undefined && { taxPercent: Number(taxPercent) }),
        ...(smsTemplate && { smsTemplate }),
        ...(reminderDays !== undefined && { reminderDays: parseInt(reminderDays) }),
      },
      create: { id: '1' },
    });
    return success(res, settings, 'Sozlamalar saqlandi');
  } catch (err) { next(err); }
});

export default router;
