import { body } from "express-validator";

export const createParentValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),

  body("lastName").trim().notEmpty().withMessage("Last name is required"),

  body("username").trim().notEmpty().withMessage("Username is required"),

  body("email").trim().isEmail().withMessage("A valid email is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("parentId").trim().notEmpty().withMessage("Parent ID is required"),

  body("gender").isIn(["Male", "Female"]).withMessage("Gender is required"),

  body("occupation").optional().trim(),

  body("workplace").optional().trim(),

  body("address").optional().trim(),
];
