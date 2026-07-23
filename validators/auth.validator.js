import { body } from "express-validator";

export const loginValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),

  body("password").trim().notEmpty().withMessage("Password is required"),
];

export const changePasswordValidator = [
  body("currentPassword")
    .trim()
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .trim()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
];

export const updateMeValidator = [
  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty")
    .isLength({ max: 50 }),

  body("lastName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty")
    .isLength({ max: 50 }),

  body("otherName").optional().trim().isLength({ max: 50 }),

  body("phoneNumber").optional().trim(),

  body("avatarUrl").optional().trim(),
];
