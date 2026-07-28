import { Router } from "express";
import classSubjectController from "../controllers/classSubject.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import {
  createClassSubjectValidator,
  bulkCreateClassSubjectValidator,
  updateClassSubjectValidator,
} from "../validators/classSubject.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createClassSubjectValidator,
  validate,
  classSubjectController.createClassSubject,
);

// Bulk-link many subjects to one class at once (all-or-nothing).
router.post(
  "/bulk",
  protect,
  authorize("admin"),
  bulkCreateClassSubjectValidator,
  validate,
  classSubjectController.bulkCreateClassSubjects,
);

router.get(
  "/",
  protect,
  authorize("admin"),
  classSubjectController.getClassSubjects,
);

// Student-scoped: subjects of the student's current class (before /:id).
router.get(
  "/my",
  protect,
  authorize("student"),
  classSubjectController.getMyClassSubjects,
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  classSubjectController.getClassSubject,
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateClassSubjectValidator,
  validate,
  classSubjectController.updateClassSubject,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  classSubjectController.deleteClassSubject,
);

export default router;
