import { Router } from "express";

import * as studentAnswerController from "../controllers/studentAnswer.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";

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
  authenticate,
  authorize("student"),
  saveAnswerValidator,
  validateRequest,
  studentAnswerController.saveAnswer,
);

/*
|--------------------------------------------------------------------------
| Get All Answers For Attempt
|--------------------------------------------------------------------------
*/

router.get(
  "/attempts/:attemptId",
  authenticate,
  authorize("student"),
  attemptIdValidatorArray,
  validateRequest,
  studentAnswerController.getAnswers,
);

/*
|--------------------------------------------------------------------------
| Review Submitted Attempt
|--------------------------------------------------------------------------
*/

router.get(
  "/attempts/:attemptId/review",
  authenticate,
  authorize("student"),
  attemptIdValidatorArray,
  validateRequest,
  studentAnswerController.reviewAnswers,
);

/*
|--------------------------------------------------------------------------
| Single Answer
|--------------------------------------------------------------------------
*/

router.get(
  "/attempts/:attemptId/questions/:questionId",
  authenticate,
  authorize("student"),
  questionAttemptValidator,
  validateRequest,
  studentAnswerController.getAnswer,
);

router.delete(
  "/attempts/:attemptId/questions/:questionId",
  authenticate,
  authorize("student"),
  questionAttemptValidator,
  validateRequest,
  studentAnswerController.clearAnswer,
);

export default router;
