import { Router } from "express";
import { login, refresh, logout, forceLogout } from "./auth.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";

const router = Router();
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/force-logout/:userId", authMiddleware, roleMiddleware("ADMIN"), forceLogout);
export default router;
