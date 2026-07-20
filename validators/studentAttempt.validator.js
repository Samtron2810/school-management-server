import { body, param } from "express-validator";

/*
|--------------------------------------------------------------------------
| Shared Validators
|--------------------------------------------------------------------------
*/

const attemptIdValidator = param("id")
  .isMongoId()
  .withMessage("Invalid attempt ID.");

const assessmentIdValidator = body("assessment")
  .notEmpty()
  .withMessage("Assessment is required.")
  .bail()
  .isMongoId()
  .withMessage("Invalid assessment ID.");

/*
|--------------------------------------------------------------------------
| Start Assessment
|--------------------------------------------------------------------------
*/

export const startAssessmentValidator = [assessmentIdValidator];

/*
|--------------------------------------------------------------------------
| Submit Assessment
|--------------------------------------------------------------------------
*/

export const submitAssessmentValidator = [attemptIdValidator];

/*
|--------------------------------------------------------------------------
| Get Attempt
|--------------------------------------------------------------------------
*/

export const getAttemptValidator = [attemptIdValidator];

/*
|--------------------------------------------------------------------------
| Auto Submit
|--------------------------------------------------------------------------
*/

export const autoSubmitValidator = [attemptIdValidator];
