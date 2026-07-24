import { Router } from "express";

import enrollmentController from "../controllers/enrollment.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createEnrollmentValidator } from "../validators/enrollment.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createEnrollmentValidator,
  validateRequest,
  enrollmentController.createEnrollment,
);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  enrollmentController.getEnrollments,
);

export default router;
