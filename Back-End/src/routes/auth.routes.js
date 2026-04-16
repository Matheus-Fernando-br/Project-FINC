import { Router } from "express";
import {
  login,
  register,
  logout,
  me,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { loginRateLimiter } from "../middlewares/loginRateLimit.js";
import {
  authMeRateLimiter,
  sensitiveWriteRateLimiter,
} from "../middlewares/securityRateLimit.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";

const router = Router();

router.post("/login", loginRateLimiter, login);
router.post("/register", register);
router.post("/logout", authMiddleware, csrfProtection, sensitiveWriteRateLimiter, logout);
router.get("/me", authMeRateLimiter, authMiddleware, me);

export default router;
