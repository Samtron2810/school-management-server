import { body, param } from "express-validator";

export const createParentValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("email").trim().isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  // Optional: the server auto-generates the next sequential ID when omitted.
  body("parentId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Parent ID cannot be empty when provided"),
  body("gender").isIn(["Male", "Female"]).withMessage("Gender is required"),
  body("occupation").optional().trim(),
  body("workplace").optional().trim(),
  body("address").optional().trim(),
];

export const updateParentValidator = [
  param("id").isMongoId().withMessage("Invalid parent ID"),
  body("firstName").optional().trim().notEmpty(),
  body("lastName").optional().trim().notEmpty(),
  body("otherName").optional().trim(),
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("A valid email is required"),
  body("phoneNumber").optional().trim(),
  body("parentId").optional().trim().notEmpty(),
  body("gender")
    .optional()
    .isIn(["Male", "Female"])
    .withMessage("Gender must be Male or Female"),
  body("occupation").optional().trim(),
  body("workplace").optional().trim(),
  body("address").optional().trim(),
  body("isActive").optional().isBoolean(),
];
