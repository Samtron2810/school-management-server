import { Router } from "express";

import termController from "../controllers/term.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import {
  createTermValidator,
  updateTermValidator,
} from "../validators/term.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createTermValidator,
  validate,
  termController.createTerm,
);

// Reads are open to every signed-in role — writes stay admin-only.
router.get("/", protect, termController.getTerms);

router.get("/:id", protect, termController.getTerm);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateTermValidator,
  validate,
  termController.updateTerm,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  termController.deleteTerm,
);

export default router;
