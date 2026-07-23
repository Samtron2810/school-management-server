import { Router } from "express";

import subjectController from "../controllers/subject.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import {
  createSubjectValidator,
  updateSubjectValidator,
} from "../validators/subject.validator.js";

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

router.get("/:id", protect, authorize("admin"), subjectController.getSubject);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateSubjectValidator,
  validate,
  subjectController.updateSubject,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  subjectController.deleteSubject,
);

export default router;
