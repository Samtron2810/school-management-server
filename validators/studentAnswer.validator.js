import { body, param } from "express-validator";

/*
|--------------------------------------------------------------------------
| Shared Validators
|--------------------------------------------------------------------------
*/

const attemptIdValidator = param("attemptId")
  .isMongoId()
  .withMessage("Invalid attempt ID.");

const questionIdValidator = param("questionId")
  .isMongoId()
  .withMessage("Invalid question ID.");

/*
|--------------------------------------------------------------------------
| Save Answer
|--------------------------------------------------------------------------
*/

export const saveAnswerValidator = [
  body("attempt")
    .notEmpty()
    .withMessage("Attempt is required.")
    .bail()
    .isMongoId()
    .withMessage("Invalid attempt ID."),

  body("question")
    .notEmpty()
    .withMessage("Question is required.")
    .bail()
    .isMongoId()
    .withMessage("Invalid question ID."),

  body("selectedAnswer")
    .trim()
    .notEmpty()
    .withMessage("Selected answer is required."),
];

/*
|--------------------------------------------------------------------------
| Attempt Routes
|--------------------------------------------------------------------------
*/

export const attemptIdValidatorArray = [attemptIdValidator];

/*
|--------------------------------------------------------------------------
| Question Routes
|--------------------------------------------------------------------------
*/

export const questionAttemptValidator = [
  attemptIdValidator,
  questionIdValidator,
];
