import { body, param, query } from "express-validator";

/*
|--------------------------------------------------------------------------
| Shared Validators
|--------------------------------------------------------------------------
*/

const questionIdValidator = param("id")
  .isMongoId()
  .withMessage("Invalid question ID.");

const teacherAssignmentValidator = body("teacherAssignment")
  .notEmpty()
  .withMessage("Teacher assignment is required.")
  .bail()
  .isMongoId()
  .withMessage("Invalid teacher assignment ID.");

const questionValidator = body("question")
  .trim()
  .notEmpty()
  .withMessage("Question is required.")
  .bail()
  .isLength({
    min: 5,
    max: 5000,
  })
  .withMessage("Question must be between 5 and 5000 characters.");

const optionsValidator = body("options")
  .isArray({
    min: 2,
    max: 6,
  })
  .withMessage("Question must have between 2 and 6 options.")
  .bail()
  .custom((options) => {
    const values = options.map((option) =>
      typeof option === "object" ? option.text?.trim() : String(option).trim(),
    );

    if (values.some((value) => !value)) {
      throw new Error("Option text cannot be empty.");
    }

    if (new Set(values).size !== values.length) {
      throw new Error("Duplicate options are not allowed.");
    }

    return true;
  });

const correctAnswerValidator = body("correctAnswer")
  .trim()
  .notEmpty()
  .withMessage("Correct answer is required.")
  .bail()
  .isIn(["A", "B", "C", "D"])
  .withMessage("Correct answer must be one of A, B, C, or D.");

const explanationValidator = body("explanation")
  .optional()
  .trim()
  .isLength({
    max: 3000,
  })
  .withMessage("Explanation cannot exceed 3000 characters.");

const marksValidator = body("marks")
  .isFloat({
    gt: 0,
  })
  .withMessage("Marks must be greater than 0.");

const difficultyValidator = body("difficulty")
  .isIn(["Easy", "Medium", "Hard"])
  .withMessage("Invalid difficulty.");

const isPublishedValidator = body("isPublished")
  .optional()
  .isBoolean()
  .withMessage("isPublished must be true or false.");

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

export const createQuestionValidator = [
  teacherAssignmentValidator,
  questionValidator,
  optionsValidator,
  correctAnswerValidator,
  explanationValidator,
  marksValidator,
  difficultyValidator,
  isPublishedValidator,
];

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/

export const updateQuestionValidator = [
  questionIdValidator,

  body("question").optional().trim().isLength({
    min: 5,
    max: 5000,
  }),

  body("options")
    .optional()
    .isArray({
      min: 2,
      max: 6,
    })
    .custom((options) => {
      const values = options.map((option) =>
        typeof option === "object"
          ? option.text?.trim()
          : String(option).trim(),
      );

      if (new Set(values).size !== values.length) {
        throw new Error("Duplicate options are not allowed.");
      }

      return true;
    }),

  body("correctAnswer")
    .optional()
    .trim()
    .notEmpty()
    .isIn(["A", "B", "C", "D"])
    .withMessage("Correct answer must be one of A, B, C, or D."),

  body("explanation").optional().trim().isLength({
    max: 3000,
  }),

  body("marks").optional().isFloat({
    gt: 0,
  }),

  body("difficulty").optional().isIn(["Easy", "Medium", "Hard"]),

  isPublishedValidator,
];

/*
|--------------------------------------------------------------------------
| Params
|--------------------------------------------------------------------------
*/

export const questionIdParamValidator = [questionIdValidator];

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

export const deleteQuestionsValidator = [
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

/*
|--------------------------------------------------------------------------
| Query
|--------------------------------------------------------------------------
*/

export const getQuestionsValidator = [
  query("page").optional().isInt({
    min: 1,
  }),

  query("limit").optional().isInt({
    min: 1,
    max: 100,
  }),

  query("teacher").optional().isMongoId(),

  query("classSubject").optional().isMongoId(),

  query("session").optional().isMongoId(),

  query("term").optional().isMongoId(),

  query("difficulty").optional().isIn(["Easy", "Medium", "Hard"]),

  query("search").optional().trim(),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "marks", "difficulty"]),

  query("sortOrder").optional().isIn(["asc", "desc"]),
];
