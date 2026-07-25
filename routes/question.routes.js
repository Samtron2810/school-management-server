import { Router } from "express";

import * as questionController from "../controllers/question.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";

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
  protect,
  authorize("admin", "teacher"),
  createQuestionValidator,
  validate,
  questionController.createQuestion,
);

router.get(
  "/",
  protect,
  getQuestionsValidator,
  validate,
  questionController.getQuestions,
);

/*
|--------------------------------------------------------------------------
| bulk delete Operations
|--------------------------------------------------------------------------
*/

router.delete(
  "/",
  protect,
  authorize("admin", "teacher"),
  deleteQuestionsValidator,
  validate,
  questionController.deleteQuestions,
);

/*
|--------------------------------------------------------------------------
| Duplicate
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/duplicate",
  protect,
  authorize("admin", "teacher"),
  questionIdParamValidator,
  validate,
  questionController.duplicateQuestion,
);

/*
|--------------------------------------------------------------------------
| Single Question
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  protect,
  questionIdParamValidator,
  validate,
  questionController.getQuestion,
);

router.patch(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  updateQuestionValidator,
  validate,
  questionController.updateQuestion,
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  questionIdParamValidator,
  validate,
  questionController.deleteQuestion,
);

export default router;
