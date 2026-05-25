import { Router } from "express";
import { generate, scan, assign, getImage } from "./barcode.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/generate", roleMiddleware("ADMIN"), generate);
router.get("/scan/:barcode", scan);
router.get("/image/:barcode", scan);
router.post("/assign", roleMiddleware("ADMIN"), assign);

export default router;
