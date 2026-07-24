import { Router } from "express";

import teacherController from "../controllers/teacher.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createTeacherValidator } from "../validators/teacher.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createTeacherValidator,
  validateRequest,
  teacherController.createTeacher,
);

router.get("/", authenticate, authorize("admin"), teacherController.getTeachers);

export default router;
