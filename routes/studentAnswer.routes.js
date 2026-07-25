import { Router } from "express";

import * as studentAnswerController from "../controllers/studentAnswer.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";

import {
  saveAnswerValidator,
  attemptIdValidatorArray,
  questionAttemptValidator,
} from "../validators/studentAnswer.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Save Answer
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  authorize("student"),
  saveAnswerValidator,
  validate,
  studentAnswerController.saveAnswer,
);

/*
|--------------------------------------------------------------------------
| Get All Answers For Attempt
|--------------------------------------------------------------------------
*/

router.get(
  "/attempts/:attemptId",
  protect,
  authorize("student"),
  attemptIdValidatorArray,
  validate,
  studentAnswerController.getAnswers,
);

/*
|--------------------------------------------------------------------------
| Review Submitted Attempt
|--------------------------------------------------------------------------
*/

router.get(
  "/attempts/:attemptId/review",
  protect,
  authorize("student"),
  attemptIdValidatorArray,
  validate,
  studentAnswerController.reviewAnswers,
);

/*
|--------------------------------------------------------------------------
| Single Answer
|--------------------------------------------------------------------------
*/

router.get(
  "/attempts/:attemptId/questions/:questionId",
  protect,
  authorize("student"),
  questionAttemptValidator,
  validate,
  studentAnswerController.getAnswer,
);

router.delete(
  "/attempts/:attemptId/questions/:questionId",
  protect,
  authorize("student"),
  questionAttemptValidator,
  validate,
  studentAnswerController.clearAnswer,
);

export default router;
