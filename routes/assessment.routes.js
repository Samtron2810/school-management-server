import { Router } from "express";

import * as assessmentController from "../controllers/assessment.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";

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
  authenticate,
  authorize("admin", "teacher"),
  createAssessmentValidator,
  validateRequest,
  assessmentController.createAssessment,
);

router.get("/", authenticate, assessmentController.getAssessments);

router.get(
  "/available",
  authenticate,
  authorize("student"),
  assessmentController.getAvailableAssessments,
);

router.get(
  "/:id",
  authenticate,
  assessmentIdParamValidator,
  validateRequest,
  assessmentController.getAssessment,
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  updateAssessmentValidator,
  validateRequest,
  assessmentController.updateAssessment,
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  assessmentIdParamValidator,
  validateRequest,
  assessmentController.deleteAssessment,
);

/*
|--------------------------------------------------------------------------
| Publish
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/publish",
  authenticate,
  authorize("admin", "teacher"),
  assessmentIdParamValidator,
  validateRequest,
  assessmentController.publishAssessment,
);

router.patch(
  "/:id/unpublish",
  authenticate,
  authorize("admin", "teacher"),
  assessmentIdParamValidator,
  validateRequest,
  assessmentController.unpublishAssessment,
);

/*
|--------------------------------------------------------------------------
| Questions
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/questions",
  authenticate,
  authorize("admin", "teacher"),
  addQuestionsValidator,
  validateRequest,
  assessmentController.addQuestionsToAssessment,
);

router.delete(
  "/:id/questions",
  authenticate,
  authorize("admin", "teacher"),
  removeQuestionsValidator,
  validateRequest,
  assessmentController.removeQuestionsFromAssessment,
);

export default router;
