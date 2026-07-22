import { Router } from "express";

import authController from "../controllers/auth.controller.js";
import {
  loginValidator,
  changePasswordValidator,
} from "../validators/auth.validator.js";
import validate from "../middlewares/validation.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import { csrfProtection } from "../config/csrf.js";
import {
  loginRateLimiter,
  passwordChangeRateLimiter,
} from "../middlewares/rateLimiters.js";

const router = Router();

router.post(
  "/login",
  loginRateLimiter,
  loginValidator,
  validate,
  authController.login,
);

router.get("/csrf-token", authController.getCsrfToken);

router.post("/refresh-token", csrfProtection, authController.refreshToken);

router.post("/logout", csrfProtection, authController.logout);

router.post(
  "/logout-all",
  protect,
  csrfProtection,
  authController.logoutAll,
);

router.get("/me", protect, authController.me);

router.patch(
  "/change-password",
  protect,
  csrfProtection,
  passwordChangeRateLimiter,
  changePasswordValidator,
  validate,
  authController.changePassword,
);

export default router;
