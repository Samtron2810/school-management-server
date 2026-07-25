import { Router } from "express";

import * as studentAttemptController from "../controllers/studentAttempt.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";

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
  protect,
  authorize("student"),
  startAssessmentValidator,
  validate,
  studentAttemptController.startAssessment,
);

router.get(
  "/",
  protect,
  authorize("admin", "teacher", "student"),
  studentAttemptController.getAttempts,
);

router.get(
  "/:id",
  protect,
  authorize("student"),
  getAttemptValidator,
  validate,
  studentAttemptController.getAttempt,
);

router.patch(
  "/:id/submit",
  protect,
  authorize("student"),
  submitAssessmentValidator,
  validate,
  studentAttemptController.submitAssessment,
);

/*
|--------------------------------------------------------------------------
| Internal (Scheduler/Cron)
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/auto-submit",
  protect,
  authorize("admin"),
  autoSubmitValidator,
  validate,
  studentAttemptController.autoSubmit,
);

router.get(
  "/:id/questions",
  protect,
  authorize("student"),
  getAttemptValidator,
  validate,
  studentAttemptController.getAttemptQuestions,
);

export default router;
