import { Router } from "express";

import authController from "../controllers/auth.controller.js";
import {
  loginValidator,
  changePasswordValidator,
} from "../validators/auth.validator.js";
import validate from "../middlewares/validation.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", loginValidator, validate, authController.login);

router.post("/refresh-token", authController.refreshToken);

router.post("/logout", authController.logout);

router.get("/me", protect, authController.me);

router.patch(
  "/change-password",
  protect,
  changePasswordValidator,
  validate,
  authController.changePassword,
);

export default router;
