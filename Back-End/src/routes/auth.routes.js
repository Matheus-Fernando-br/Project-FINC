import { Router } from "express";
import {
  login,
  register,
  logout,
  me,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { loginRateLimiter } from "../middlewares/loginRateLimit.js";

const router = Router();

router.post("/login", loginRateLimiter, login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);

export default router;
