import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { changePassword, updateProfile, getMyProfile } from "../controllers/profile.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMyProfile);     
router.put("/", updateProfile);
router.put("/password", changePassword);

export default router;