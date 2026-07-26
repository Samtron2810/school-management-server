import { body } from "express-validator";

export const bulkSaveScoresValidator = [
  body("classSubject").notEmpty().withMessage("Class subject is required"),

  body("entries")
    .isArray({ min: 1 })
    .withMessage("At least one entry is required"),

  body("entries.*.student")
    .notEmpty()
    .withMessage("Each entry needs a student id"),

  body("entries.*.scores")
    .optional()
    .isObject()
    .withMessage("Scores must be an object of column -> value"),
];
