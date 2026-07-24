import { Router } from "express";

import termController from "../controllers/term.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createTermValidator } from "../validators/term.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createTermValidator,
  validateRequest,
  termController.createTerm,
);

router.get("/", authenticate, authorize("admin"), termController.getTerms);

export default router;
