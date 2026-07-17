import { Router } from "express";

import classController from "../controllers/class.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createClassValidator } from "../validators/class.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createClassValidator,
  validate,
  classController.createClass,
);

router.get("/", protect, authorize("admin"), classController.getClasses);

export default router;
