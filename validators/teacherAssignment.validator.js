import { body } from "express-validator";

export const createTeacherAssignmentValidator = [
  body("teacher").notEmpty().withMessage("Teacher is required"),

  body("subject").notEmpty().withMessage("Subject is required"),

  body("schoolClass").notEmpty().withMessage("Class is required"),
];
