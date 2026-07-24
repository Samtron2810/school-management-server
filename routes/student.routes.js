import { Router } from "express";

import studentController from "../controllers/student.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";

import { createStudentValidator } from "../validators/student.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createStudentValidator,
  validateRequest,
  studentController.createStudent,
);

router.get("/", authenticate, authorize("admin"), studentController.getStudents);

export default router;
