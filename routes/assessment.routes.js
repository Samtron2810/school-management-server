import { Router } from "express";

import * as assessmentController from "../controllers/assessment.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";

import {
  createAssessmentValidator,
  updateAssessmentValidator,
  assessmentIdParamValidator,
  addQuestionsValidator,
  removeQuestionsValidator,
} from "../validators/assessment.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Assessment CRUD
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  authorize("admin", "teacher"),
  createAssessmentValidator,
  validate,
  assessmentController.createAssessment,
);

router.get("/", protect, assessmentController.getAssessments);

router.get(
  "/available",
  protect,
  authorize("student"),
  assessmentController.getAvailableAssessments,
);

router.get(
  "/:id",
  protect,
  assessmentIdParamValidator,
  validate,
  assessmentController.getAssessment,
);

router.patch(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  updateAssessmentValidator,
  validate,
  assessmentController.updateAssessment,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  assessmentIdParamValidator,
  validate,
  assessmentController.deleteAssessment,
);

/*
|--------------------------------------------------------------------------
| Publish
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/publish",
  protect,
  authorize("admin", "teacher"),
  assessmentIdParamValidator,
  validate,
  assessmentController.publishAssessment,
);

router.patch(
  "/:id/unpublish",
  protect,
  authorize("admin", "teacher"),
  assessmentIdParamValidator,
  validate,
  assessmentController.unpublishAssessment,
);

/*
|--------------------------------------------------------------------------
| Questions
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/questions",
  protect,
  authorize("admin", "teacher"),
  addQuestionsValidator,
  validate,
  assessmentController.addQuestionsToAssessment,
);

router.delete(
  "/:id/questions",
  protect,
  authorize("admin", "teacher"),
  removeQuestionsValidator,
  validate,
  assessmentController.removeQuestionsFromAssessment,
);

export default router;
