import { Router } from "express";

import authController from "../controllers/auth.controller.js";
import {
  loginValidator,
  changePasswordValidator,
} from "../validators/auth.validator.js";
import validateRequest from "../middlewares/validateRequest.js";
import authenticate from "../middlewares/authenticate.js";
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
  validateRequest,
  authController.login,
);

router.get("/csrf-token", authController.getCsrfToken);

router.post("/refresh-token", csrfProtection, authController.refreshToken);

router.post("/logout", csrfProtection, authController.logout);

router.post(
  "/logout-all",
  authenticate,
  csrfProtection,
  authController.logoutAll,
);

router.get("/me", authenticate, authController.me);

router.patch(
  "/change-password",
  authenticate,
  csrfProtection,
  passwordChangeRateLimiter,
  changePasswordValidator,
  validateRequest,
  authController.changePassword,
);

export default router;
