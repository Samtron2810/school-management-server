import { body, param } from "express-validator";

export const createStudentValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),

  body("lastName").trim().notEmpty().withMessage("Last name is required"),

  body("username").trim().notEmpty().withMessage("Username is required"),

  body("email").trim().isEmail().withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  // Optional: the server auto-generates the next sequential number when omitted.
  body("admissionNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Admission number cannot be empty when provided"),

  body("gender").isIn(["Male", "Female"]).withMessage("Gender is required"),

  body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),

  body("admissionDate").notEmpty().withMessage("Admission date is required"),
];

export const updateStudentValidator = [
  param("id").isMongoId().withMessage("Invalid student ID"),

  body("firstName").optional().trim().notEmpty(),

  body("lastName").optional().trim().notEmpty(),

  body("otherName").optional().trim(),

  body("username")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),

  body("email").optional().trim().isEmail().withMessage("Valid email is required"),

  body("phoneNumber").optional().trim(),

  body("admissionNumber").optional().trim().notEmpty(),

  body("gender")
    .optional()
    .isIn(["Male", "Female"])
    .withMessage("Gender must be Male or Female"),

  body("dateOfBirth").optional().isISO8601().withMessage("Invalid date"),

  body("admissionDate").optional().isISO8601().withMessage("Invalid date"),

  body("address").optional().trim(),

  body("bloodGroup").optional().trim(),

  body("genotype").optional().trim(),

  body("nationality").optional().trim(),

  body("stateOfOrigin").optional().trim(),

  body("localGovernment").optional().trim(),

  body("religion").optional().trim(),

  body("isActive").optional().isBoolean(),
];
