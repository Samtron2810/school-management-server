import { body, param } from "express-validator";

export const createClassSubjectValidator = [
  body("schoolClass").notEmpty().withMessage("Class is required"),

  body("subject").notEmpty().withMessage("Subject is required"),
];

export const bulkCreateClassSubjectValidator = [
  body("subjects")
    .isArray({ min: 1 })
    .withMessage("At least one subject is required"),

  body("subjects.*").isMongoId().withMessage("Invalid subject ID"),

  body("schoolClass").notEmpty().withMessage("Class is required"),

  body("isCompulsory").optional().isBoolean(),
];

export const updateClassSubjectValidator = [
  param("id").isMongoId().withMessage("Invalid class subject ID"),

  body("schoolClass").optional().isMongoId().withMessage("Invalid class ID"),

  body("subject").optional().isMongoId().withMessage("Invalid subject ID"),

  body("isCompulsory").optional().isBoolean(),

  body("isActive").optional().isBoolean(),
];
