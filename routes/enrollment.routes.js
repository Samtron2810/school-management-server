import { Router } from "express";

import enrollmentController from "../controllers/enrollment.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createEnrollmentValidator } from "../validators/enrollment.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createEnrollmentValidator,
  validate,
  enrollmentController.createEnrollment,
);

router.get(
  "/",
  protect,
  authorize("admin"),
  enrollmentController.getEnrollments,
);

export default router;
