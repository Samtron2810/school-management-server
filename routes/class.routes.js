import { Router } from "express";

import classController from "../controllers/class.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createClassValidator } from "../validators/class.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createClassValidator,
  validateRequest,
  classController.createClass,
);

router.get("/", authenticate, authorize("admin"), classController.getClasses);

export default router;
