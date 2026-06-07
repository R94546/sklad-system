import { Router } from "express";
import {
  getCurrentHandler, openHandler, closeHandler, movementHandler, getByIdHandler, getAllHandler,
} from "./sessions.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";

const router = Router();

router.use(authMiddleware);

// Конкретные пути — до /:id
router.get("/current", getCurrentHandler);
router.post("/open", openHandler);
router.post("/movements", movementHandler);
router.get("/", roleMiddleware("ADMIN"), getAllHandler);
router.post("/:id/close", closeHandler);
router.get("/:id", getByIdHandler);

export default router;
