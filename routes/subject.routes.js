import { Router } from "express";

import subjectController from "../controllers/subject.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createSubjectValidator } from "../validators/subject.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createSubjectValidator,
  validate,
  subjectController.createSubject,
);

router.get("/", protect, authorize("admin"), subjectController.getSubjects);

export default router;
