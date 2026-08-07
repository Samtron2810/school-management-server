import { Router } from "express";

import authController from "../controllers/auth.controller.js";
import {
  loginValidator,
  changePasswordValidator,
  updateMeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/auth.validator.js";
import validate from "../middlewares/validation.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
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

router.post("/refresh-token", authController.refreshToken);

router.post("/logout", authController.logout);

router.post("/logout-all", protect, authController.logoutAll);

router.get("/me", protect, authController.me);

router.patch(
  "/me",
  protect,
  updateMeValidator,
  validate,
  authController.updateMe,
);

router.patch(
  "/change-password",
  protect,
  passwordChangeRateLimiter,
  changePasswordValidator,
  validate,
  authController.changePassword,
);

// Forgot/reset password — public, no CSRF required (no session yet)
router.post(
  "/forgot-password",
  loginRateLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  loginRateLimiter,
  resetPasswordValidator,
  validate,
  authController.resetPassword,
);

// Email verification — GET with ?token= (public, link from email)
router.get("/verify-email", authController.verifyEmail);

// Resend verification email — protected, user must be signed in
router.post(
  "/resend-verification",
  protect,
  authController.resendVerificationEmail,
);

export default router;
