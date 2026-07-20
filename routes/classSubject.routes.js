import { Router } from "express";

import classSubjectController from "../controllers/classSubject.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createClassSubjectValidator } from "../validators/classSubject.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createClassSubjectValidator,
  validate,
  classSubjectController.createClassSubject,
);

router.get(
  "/",
  protect,
  authorize("admin"),
  classSubjectController.getClassSubjects,
);

export default router;
