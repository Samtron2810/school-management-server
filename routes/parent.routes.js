import { Router } from "express";

import parentController from "../controllers/parent.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createParentValidator } from "../validators/parent.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createParentValidator,
  validateRequest,
  parentController.createParent,
);

router.get("/", authenticate, authorize("admin"), parentController.getParents);

router.get("/:id", authenticate, authorize("admin"), parentController.getParentById);

export default router;
