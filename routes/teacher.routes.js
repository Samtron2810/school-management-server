import { Router } from "express";

import teacherController from "../controllers/teacher.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import {
  createTeacherValidator,
  updateTeacherValidator,
} from "../validators/teacher.validator.js";

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

router.get(
  "/:id",
  protect,
  authorize("admin"),
  teacherController.getTeacher,
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateTeacherValidator,
  validate,
  teacherController.updateTeacher,
);

export default router;
