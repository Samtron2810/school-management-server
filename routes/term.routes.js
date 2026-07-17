import { Router } from "express";

import termController from "../controllers/term.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createTermValidator } from "../validators/term.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createTermValidator,
  validate,
  termController.createTerm,
);

router.get("/", protect, authorize("admin"), termController.getTerms);

export default router;
