import { body } from "express-validator";

export const createSubjectValidator = [
  body("name").trim().notEmpty().withMessage("Subject name is required"),

  body("code").trim().notEmpty().withMessage("Subject code is required"),
];
