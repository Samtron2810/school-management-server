import { body, param } from "express-validator";

/*
|--------------------------------------------------------------------------
| Shared Validators
|--------------------------------------------------------------------------
*/

const assessmentIdValidator = param("id")
  .isMongoId()
  .withMessage("Invalid assessment ID.");

const questionItemValidator = body("questions.*.question")
  .isMongoId()
  .withMessage("Invalid question ID.");

const orderValidator = body("questions.*.order")
  .isInt({ min: 1 })
  .withMessage("Question order must be at least 1.");

const marksValidator = body("questions.*.marks")
  .optional()
  .isFloat({ gt: 0 })
  .withMessage("Marks must be greater than 0.");

const isBonusValidator = body("questions.*.isBonus")
  .optional()
  .isBoolean()
  .withMessage("isBonus must be true or false.");

const isRequiredValidator = body("questions.*.isRequired")
  .optional()
  .isBoolean()
  .withMessage("isRequired must be true or false.");

/*
|--------------------------------------------------------------------------
| Create Assessment
|--------------------------------------------------------------------------
*/

export const createAssessmentValidator = [
  body("teacherAssignment")
    .trim()
    .notEmpty()
    .withMessage("Teacher assignment is required.")
    .bail()
    .isMongoId()
    .withMessage("Invalid teacher assignment ID."),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required.")
    .bail()
    .isLength({
      min: 3,
      max: 150,
    })
    .withMessage("Title must be between 3 and 150 characters."),

  body("instructions")
    .optional()
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("Instructions cannot exceed 5000 characters."),

  body("type")
    .notEmpty()
    .withMessage("Assessment type is required.")
    .bail()
    .isIn(["Assignment", "Quiz", "Test", "Examination"])
    .withMessage("Invalid assessment type."),

  body("duration")
    .notEmpty()
    .withMessage("Duration is required.")
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage("Duration must be at least 1 minute."),

  body("passingScore")
    .notEmpty()
    .withMessage("Passing score is required.")
    .bail()
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage("Passing score must be between 0 and 100."),

  body("maxAttempts")
    .notEmpty()
    .withMessage("Maximum attempts is required.")
    .bail()
    .isInt({
      min: 1,
      max: 20,
    })
    .withMessage("Maximum attempts must be between 1 and 20."),

  body("shuffleQuestions")
    .isBoolean()
    .withMessage("shuffleQuestions must be true or false."),

  body("shuffleOptions")
    .isBoolean()
    .withMessage("shuffleOptions must be true or false."),

  body("showScoreImmediately")
    .isBoolean()
    .withMessage("showScoreImmediately must be true or false."),

  body("showCorrectAnswers")
    .isBoolean()
    .withMessage("showCorrectAnswers must be true or false."),

  body("availableFrom")
    .notEmpty()
    .withMessage("availableFrom is required.")
    .bail()
    .isISO8601()
    .withMessage("Invalid availableFrom date."),

  body("availableTo")
    .notEmpty()
    .withMessage("availableTo is required.")
    .bail()
    .isISO8601()
    .withMessage("Invalid availableTo date.")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.availableFrom)) {
        throw new Error("availableTo must be after availableFrom.");
      }

      return true;
    }),
];

/*
|--------------------------------------------------------------------------
| Update Assessment
|--------------------------------------------------------------------------
*/

export const updateAssessmentValidator = [
  assessmentIdValidator,

  body("title")
    .optional()
    .trim()
    .isLength({
      min: 3,
      max: 150,
    })
    .withMessage("Title must be between 3 and 150 characters."),

  body("instructions")
    .optional()
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("Instructions cannot exceed 5000 characters."),

  body("type")
    .optional()
    .isIn(["Assignment", "Quiz", "Test", "Examination"])
    .withMessage("Invalid assessment type."),

  body("duration")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage("Duration must be at least 1 minute."),

  body("passingScore")
    .optional()
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage("Passing score must be between 0 and 100."),

  body("maxAttempts")
    .optional()
    .isInt({
      min: 1,
      max: 20,
    })
    .withMessage("Maximum attempts must be between 1 and 20."),

  body("shuffleQuestions").optional().isBoolean(),

  body("shuffleOptions").optional().isBoolean(),

  body("showScoreImmediately").optional().isBoolean(),

  body("showCorrectAnswers").optional().isBoolean(),

  body("availableFrom")
    .optional()
    .isISO8601()
    .withMessage("Invalid availableFrom date."),

  body("availableTo")
    .optional()
    .isISO8601()
    .withMessage("Invalid availableTo date.")
    .custom((value, { req }) => {
      if (
        req.body.availableFrom &&
        new Date(value) <= new Date(req.body.availableFrom)
      ) {
        throw new Error("availableTo must be after availableFrom.");
      }

      return true;
    }),
];

/*
|--------------------------------------------------------------------------
| Assessment ID
|--------------------------------------------------------------------------
*/

export const assessmentIdParamValidator = [assessmentIdValidator];

/*
|--------------------------------------------------------------------------
| Add Questions
|--------------------------------------------------------------------------
*/

export const addQuestionsValidator = [
  assessmentIdValidator,

  body("questions")
    .isArray({
      min: 1,
    })
    .withMessage("Questions must be a non-empty array."),

  questionItemValidator,

  orderValidator,

  marksValidator,

  isBonusValidator,

  isRequiredValidator,

  body("questions").custom((questions) => {
    const ids = questions.map((question) => question.question);

    if (new Set(ids).size !== ids.length) {
      throw new Error("Duplicate questions are not allowed.");
    }

    return true;
  }),
];

/*
|--------------------------------------------------------------------------
| Remove Questions
|--------------------------------------------------------------------------
*/

export const removeQuestionsValidator = [
  assessmentIdValidator,

  body("questionIds")
    .isArray({
      min: 1,
    })
    .withMessage("questionIds must be a non-empty array."),

  body("questionIds.*").isMongoId().withMessage("Invalid question ID."),

  body("questionIds").custom((ids) => {
    if (new Set(ids).size !== ids.length) {
      throw new Error("Duplicate question IDs are not allowed.");
    }

    return true;
  }),
];
