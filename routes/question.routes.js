import { Router } from "express";

import * as questionController from "../controllers/question.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  createQuestionValidator,
  updateQuestionValidator,
  questionIdParamValidator,
  deleteQuestionsValidator,
  getQuestionsValidator,
} from "../validators/question.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| CRUD
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  createQuestionValidator,
  validateRequest,
  questionController.createQuestion,
);

router.get(
  "/",
  authenticate,
  getQuestionsValidator,
  validateRequest,
  questionController.getQuestions,
);

/*
|--------------------------------------------------------------------------
| bulk delete Operations
|--------------------------------------------------------------------------
*/

router.delete(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  deleteQuestionsValidator,
  validateRequest,
  questionController.deleteQuestions,
);

/*
|--------------------------------------------------------------------------
| Duplicate
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/duplicate",
  authenticate,
  authorize("admin", "teacher"),
  questionIdParamValidator,
  validateRequest,
  questionController.duplicateQuestion,
);

/*
|--------------------------------------------------------------------------
| Single Question
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  authenticate,
  questionIdParamValidator,
  validateRequest,
  questionController.getQuestion,
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  updateQuestionValidator,
  validateRequest,
  questionController.updateQuestion,
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  questionIdParamValidator,
  validateRequest,
  questionController.deleteQuestion,
);

export default router;
