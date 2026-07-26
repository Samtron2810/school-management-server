import { Router } from "express";
import enrollmentController from "../controllers/enrollment.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import {
  createEnrollmentValidator,
  bulkCreateEnrollmentValidator,
  updateEnrollmentValidator,
} from "../validators/enrollment.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createEnrollmentValidator,
  validate,
  enrollmentController.createEnrollment,
);

// Bulk-enroll many students into one class at once (all-or-nothing).
router.post(
  "/bulk",
  protect,
  authorize("admin"),
  bulkCreateEnrollmentValidator,
  validate,
  enrollmentController.bulkCreateEnrollments,
);

router.get(
  "/",
  protect,
  authorize("admin"),
  enrollmentController.getEnrollments,
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  enrollmentController.getEnrollment,
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateEnrollmentValidator,
  validate,
  enrollmentController.updateEnrollment,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  enrollmentController.deleteEnrollment,
);

export default router;
