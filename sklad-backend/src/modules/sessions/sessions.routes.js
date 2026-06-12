import { Router } from "express";
import {
  getCurrentHandler, openHandler, closeHandler, reopenHandler, movementHandler, getByIdHandler, getAllHandler,
} from "./sessions.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";

const router = Router();

router.use(authMiddleware);

// Конкретные пути — до /:id
router.get("/current", getCurrentHandler);
// Кассу открывает/закрывает/переоткрывает только админ, продавцы подключаются
router.post("/open", roleMiddleware("ADMIN"), openHandler);
router.post("/movements", movementHandler);
router.get("/", roleMiddleware("ADMIN"), getAllHandler);
router.post("/:id/close", roleMiddleware("ADMIN"), closeHandler);
router.post("/:id/reopen", roleMiddleware("ADMIN"), reopenHandler);
router.get("/:id", getByIdHandler);

export default router;
