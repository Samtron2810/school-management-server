import { Router } from "express";

import studentController from "../controllers/student.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";

import { createStudentValidator } from "../validators/student.validator.js";

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

export default router;
