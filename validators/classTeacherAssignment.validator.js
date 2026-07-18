import { body } from "express-validator";

export const createClassTeacherAssignmentValidator = [
  body("teacher").notEmpty().withMessage("Teacher is required"),

  body("schoolClass").notEmpty().withMessage("Class is required"),
];
