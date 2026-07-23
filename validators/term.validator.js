import { body, param } from "express-validator";

export const createTermValidator = [
  body("name").trim().notEmpty().withMessage("Term name is required"),
  body("startDate").notEmpty().withMessage("Start date is required"),
  body("endDate").notEmpty().withMessage("End date is required"),
];

export const updateTermValidator = [
  param("id").isMongoId().withMessage("Invalid term ID"),
  body("name")
    .optional()
    .isIn(["First Term", "Second Term", "Third Term"])
    .withMessage("Invalid term name"),
  body("startDate").optional().isISO8601().withMessage("Invalid start date"),
  body("endDate").optional().isISO8601().withMessage("Invalid end date"),
  body("isCurrent").optional().isBoolean().withMessage("isCurrent must be true or false"),
];
