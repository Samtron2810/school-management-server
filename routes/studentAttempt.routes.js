import { Router } from "express";

import * as studentAttemptController from "../controllers/studentAttempt.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  startAssessmentValidator,
  submitAssessmentValidator,
  getAttemptValidator,
  autoSubmitValidator,
} from "../validators/studentAttempt.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Attempts
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  authorize("student"),
  startAssessmentValidator,
  validateRequest,
  studentAttemptController.startAssessment,
);

router.get(
  "/",
  authenticate,
  authorize("student"),
  studentAttemptController.getAttempts,
);

router.get(
  "/:id",
  authenticate,
  authorize("student"),
  getAttemptValidator,
  validateRequest,
  studentAttemptController.getAttempt,
);

router.patch(
  "/:id/submit",
  authenticate,
  authorize("student"),
  submitAssessmentValidator,
  validateRequest,
  studentAttemptController.submitAssessment,
);

/*
|--------------------------------------------------------------------------
| Internal (Scheduler/Cron)
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/auto-submit",
  authenticate,
  authorize("admin"),
  autoSubmitValidator,
  validateRequest,
  studentAttemptController.autoSubmit,
);

router.get(
  "/:id/questions",
  authenticate,
  authorize("student"),
  getAttemptValidator,
  validateRequest,
  studentAttemptController.getAttemptQuestions,
);

export default router;
