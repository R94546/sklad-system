import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { success, error } from '../../utils/response.js';
import { uploadImage, deleteImage } from '../../utils/upload.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'Fayl yuklanmadi', 400);
    const url = await uploadImage(req.file, 'products');
    return success(res, { url }, 'Rasm yuklandi');
  } catch (err) { next(err); }
});

router.delete('/', async (req, res, next) => {
  try {
    if (!req.body.url) return error(res, 'URL kerak', 400);
    await deleteImage(req.body.url);
    return success(res, null, 'Rasm ochirildi');
  } catch (err) { next(err); }
});

export default router;
