import { body } from "express-validator";

export const createTermValidator = [
  body("name").trim().notEmpty().withMessage("Term name is required"),

  body("startDate").notEmpty().withMessage("Start date is required"),

  body("endDate").notEmpty().withMessage("End date is required"),
];
