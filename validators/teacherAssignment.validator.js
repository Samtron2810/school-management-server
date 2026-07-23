import { body, param } from "express-validator";

export const createTeacherAssignmentValidator = [
  body("teacher").notEmpty().withMessage("Teacher is required"),

  body("subject").notEmpty().withMessage("Subject is required"),

  body("schoolClass").notEmpty().withMessage("Class is required"),
];

export const updateTeacherAssignmentValidator = [
  param("id").isMongoId().withMessage("Invalid assignment ID"),

  body("teacher").optional().isMongoId().withMessage("Invalid teacher ID"),

  body("subject").optional().isMongoId().withMessage("Invalid subject ID"),

  body("schoolClass").optional().isMongoId().withMessage("Invalid class ID"),

  body("isActive").optional().isBoolean(),
];
