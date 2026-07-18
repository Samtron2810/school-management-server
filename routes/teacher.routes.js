import { Router } from "express";

import teacherController from "../controllers/teacher.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createTeacherValidator } from "../validators/teacher.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createTeacherValidator,
  validate,
  teacherController.createTeacher,
);

router.get("/", protect, authorize("admin"), teacherController.getTeachers);

export default router;
