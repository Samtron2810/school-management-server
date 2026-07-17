import { body } from "express-validator";

export const createTeacherValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),

  body("lastName").trim().notEmpty().withMessage("Last name is required"),

  body("username").trim().notEmpty().withMessage("Username is required"),

  body("email").trim().isEmail().withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("teacherId").trim().notEmpty().withMessage("Teacher ID is required"),

  body("gender").notEmpty().withMessage("Gender is required"),

  body("employmentDate").notEmpty().withMessage("Employment date is required"),
];
