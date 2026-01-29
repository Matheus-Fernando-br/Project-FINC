import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  changePassword,
  updateProfile
} from "../controllers/profile.controller.js";

const router = express.Router();

router.put("/", authMiddleware, updateProfile);
router.put("/password", authMiddleware, changePassword);

export default router;
