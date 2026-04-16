import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { changePassword, updateProfile, getMyProfile } from "../controllers/profile.controller.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";
import { sensitiveWriteRateLimiter } from "../middlewares/securityRateLimit.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMyProfile);     
router.put("/", csrfProtection, sensitiveWriteRateLimiter, updateProfile);
router.put("/password", csrfProtection, sensitiveWriteRateLimiter, changePassword);

export default router;