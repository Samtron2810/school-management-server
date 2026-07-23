import { body, param } from "express-validator";

const userIdParam = [param("id").isMongoId().withMessage("Invalid user ID")];

export const createUserValidator = [
  body("firstName").notEmpty().withMessage("First name is required").trim(),
  body("lastName").notEmpty().withMessage("Last name is required").trim(),
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("email")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .isIn(["admin", "teacher", "student", "parent"])
    .withMessage("Invalid role"),
  body("phoneNumber").optional().trim(),
];

export const updateUserValidator = [
  ...userIdParam,
  body("firstName").optional().trim().notEmpty(),
  body("lastName").optional().trim().notEmpty(),
  body("otherName").optional().trim(),
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("email").optional().isEmail().withMessage("A valid email is required"),
  body("phoneNumber").optional().trim(),
  body("role")
    .optional()
    .isIn(["admin", "teacher", "student", "parent"])
    .withMessage("Invalid role"),
];

export const updateUserStatusValidator = [
  ...userIdParam,
  body("isActive").isBoolean().withMessage("isActive must be true or false"),
];

export const resetUserPasswordValidator = [
  ...userIdParam,
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];
