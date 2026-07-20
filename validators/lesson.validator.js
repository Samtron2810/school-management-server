import { body } from "express-validator";

export const createLessonValidator = [
  body("teacherAssignment")
    .notEmpty()
    .withMessage("Teacher assignment is required"),

  body("title").trim().notEmpty().withMessage("Title is required"),

  body("topic").trim().notEmpty().withMessage("Topic is required"),

  body("week")
    .notEmpty()
    .withMessage("Week is required")
    .isInt({ min: 1 })
    .withMessage("Week must be a positive number"),

  body("description").optional().trim(),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),
];

export const updateLessonValidator = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),

  body("topic")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Topic cannot be empty"),

  body("week")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Week must be a positive number"),

  body("description").optional().trim(),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),
];
