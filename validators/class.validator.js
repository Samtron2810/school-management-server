import { body } from "express-validator";

export const createClassValidator = [
  body("level").notEmpty().withMessage("Level is required"),

  body("className").trim().notEmpty().withMessage("Class name is required"),

  body("arm").trim().notEmpty().withMessage("Class arm is required"),
];
