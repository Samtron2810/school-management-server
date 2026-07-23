import { Router } from "express";

import studentController from "../controllers/student.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";

import {
  createStudentValidator,
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
