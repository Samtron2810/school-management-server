import { body, param } from "express-validator";

export const createSessionValidator = [
  body("name").trim().notEmpty().withMessage("Session name is required"),
  body("startDate").notEmpty().withMessage("Start date is required"),
  body("endDate").notEmpty().withMessage("End date is required"),
];

export const updateSessionValidator = [
  param("id").isMongoId().withMessage("Invalid session ID"),
  body("name").optional().trim().notEmpty().withMessage("Session name cannot be empty"),
  body("startDate").optional().isISO8601().withMessage("Invalid start date"),
  body("endDate").optional().isISO8601().withMessage("Invalid end date"),
  body("isCurrent").optional().isBoolean().withMessage("isCurrent must be true or false"),
];
