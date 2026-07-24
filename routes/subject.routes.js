import { Router } from "express";

import subjectController from "../controllers/subject.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createSubjectValidator } from "../validators/subject.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createSubjectValidator,
  validateRequest,
  subjectController.createSubject,
);

router.get("/", authenticate, authorize("admin"), subjectController.getSubjects);

export default router;
