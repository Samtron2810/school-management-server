import { body, param } from "express-validator";

export const createTeacherValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),

  body("lastName").trim().notEmpty().withMessage("Last name is required"),

  body("username").trim().notEmpty().withMessage("Username is required"),

  body("email").trim().isEmail().withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  // Optional: the server auto-generates the next sequential ID when omitted.
  body("teacherId").optional().trim()
    .notEmpty()
    .withMessage("Teacher ID cannot be empty when provided"),

  body("gender").notEmpty().withMessage("Gender is required"),

  body("employmentDate").notEmpty().withMessage("Employment date is required"),
];

export const updateTeacherValidator = [
  param("id").isMongoId().withMessage("Invalid teacher ID"),

  body("firstName").optional().trim().notEmpty(),

  body("lastName").optional().trim().notEmpty(),

  body("otherName").optional().trim(),

  body("username")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),

  body("email").optional().trim().isEmail().withMessage("Valid email is required"),

  body("teacherId").optional().trim().notEmpty(),

  body("gender")
    .optional()
    .isIn(["Male", "Female"])
    .withMessage("Gender must be Male or Female"),

  body("phoneNumber").optional().trim(),

  body("address").optional().trim(),

  body("qualification").optional().trim(),

  body("specialization").optional().trim(),

  body("employmentDate").optional().isISO8601().withMessage("Invalid date"),

  body("dateOfBirth").optional().isISO8601().withMessage("Invalid date"),

  body("isClassTeacher").optional().isBoolean(),

  body("isActive").optional().isBoolean(),
];
