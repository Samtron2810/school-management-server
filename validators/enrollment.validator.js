import { body } from "express-validator";

export const createEnrollmentValidator = [
  body("student").notEmpty().withMessage("Student is required"),

  body("schoolClass").notEmpty().withMessage("Class is required"),
];
