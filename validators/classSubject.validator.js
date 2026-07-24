import { body } from "express-validator";

export const createClassSubjectValidator = [
  body("schoolClass").notEmpty().withMessage("Class is required"),

  body("subject").notEmpty().withMessage("Subject is required"),
];
