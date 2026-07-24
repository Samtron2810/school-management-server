import { Router } from "express";

import teacherAssignmentController from "../controllers/teacherAssignment.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createTeacherAssignmentValidator } from "../validators/teacherAssignment.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createTeacherAssignmentValidator,
  validateRequest,
  teacherAssignmentController.createTeacherAssignment,
);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  teacherAssignmentController.getTeacherAssignments,
);

export default router;
