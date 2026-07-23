import { body, param } from "express-validator";

export const createEnrollmentValidator = [
  body("student").notEmpty().withMessage("Student is required"),

  body("schoolClass").notEmpty().withMessage("Class is required"),
];

export const updateEnrollmentValidator = [
  param("id").isMongoId().withMessage("Invalid enrollment ID"),

  body("schoolClass").optional().isMongoId().withMessage("Invalid class ID"),

  body("status")
    .optional()
    .isIn(["Active", "Transferred", "Graduated", "Withdrawn", "Suspended"])
    .withMessage("Invalid enrollment status"),

  body("rollNumber").optional({ nullable: true }).isInt({ min: 1 }),

  body("enrollmentNumber").optional().trim(),
];
