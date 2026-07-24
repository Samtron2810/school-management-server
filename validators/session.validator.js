import { body } from "express-validator";

export const createSessionValidator = [
  body("name").trim().notEmpty().withMessage("Session name is required"),

  body("startDate").notEmpty().withMessage("Start date is required"),

  body("endDate").notEmpty().withMessage("End date is required"),
];
