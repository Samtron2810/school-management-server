import { Router } from "express";

import teacherAssignmentController from "../controllers/teacherAssignment.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createTeacherAssignmentValidator } from "../validators/teacherAssignment.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createTeacherAssignmentValidator,
  validate,
  teacherAssignmentController.createTeacherAssignment,
);

router.get(
  "/",
  protect,
  authorize("admin"),
  teacherAssignmentController.getTeacherAssignments,
);

export default router;
