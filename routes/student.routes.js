import { Router } from "express";

import studentController from "../controllers/student.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";

import {
  createStudentValidator,
  bulkCreateStudentValidator,
  updateStudentValidator,
} from "../validators/student.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createStudentValidator,
  validate,
  studentController.createStudent,
);

// Bulk-add students (dryRun: true only validates). Rows succeed or fail
// individually.
router.post(
  "/bulk",
  protect,
  authorize("admin"),
  bulkCreateStudentValidator,
  validate,
  studentController.bulkCreateStudents,
);

router.get("/", protect, authorize("admin"), studentController.getStudents);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  studentController.getStudent,
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateStudentValidator,
  validate,
  studentController.updateStudent,
);

export default router;
