import { body } from "express-validator";

export const createStudentValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),

  body("lastName").trim().notEmpty().withMessage("Last name is required"),

  body("username").trim().notEmpty().withMessage("Username is required"),

  body("email").trim().isEmail().withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("admissionNumber")
    .trim()
    .notEmpty()
    .withMessage("Admission number is required"),

  body("gender").isIn(["Male", "Female"]).withMessage("Gender is required"),

  body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),

  body("admissionDate").notEmpty().withMessage("Admission date is required"),
];
