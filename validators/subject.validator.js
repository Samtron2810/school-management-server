import { body, param } from "express-validator";

export const createSubjectValidator = [
  body("name").trim().notEmpty().withMessage("Subject name is required"),
  body("code").trim().notEmpty().withMessage("Subject code is required"),
];

export const updateSubjectValidator = [
  param("id").isMongoId().withMessage("Invalid subject ID"),
  body("name").optional().trim().notEmpty().withMessage("Subject name cannot be empty"),
  body("code").optional().trim().notEmpty().withMessage("Subject code cannot be empty"),
];
