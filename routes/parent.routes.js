import { Router } from "express";

import parentController from "../controllers/parent.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createParentValidator } from "../validators/parent.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createParentValidator,
  validate,
  parentController.createParent,
);

router.get("/", protect, authorize("admin"), parentController.getParents);

router.get("/:id", protect, authorize("admin"), parentController.getParentById);

export default router;
