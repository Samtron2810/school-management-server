import { body, param } from "express-validator";

export const createClassValidator = [
  body("level").notEmpty().withMessage("Level is required"),
  body("className").trim().notEmpty().withMessage("Class name is required"),
  body("arm").trim().notEmpty().withMessage("Class arm is required"),
];

export const updateClassValidator = [
  param("id").isMongoId().withMessage("Invalid class ID"),
  body("level")
    .optional()
    .isIn(["Creche", "Nursery", "Primary", "JSS", "SSS"])
    .withMessage("Invalid level"),
  body("className").optional().trim().notEmpty().withMessage("Class name cannot be empty"),
  body("arm").optional().trim().notEmpty().withMessage("Class arm cannot be empty"),
  body("description").optional().trim(),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false"),
];
