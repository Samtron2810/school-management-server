import { body } from "express-validator";

export const createClassTeacherAssignmentValidator = [
  body("teacher").notEmpty().withMessage("Teacher is required"),

  body("schoolClass").notEmpty().withMessage("Class is required"),
];

export const updateClassTeacherAssignmentValidator = [
  body("teacher").optional().isMongoId().withMessage("Invalid teacher"),

  body("isActive").optional().isBoolean(),
];
