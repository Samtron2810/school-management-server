import { Router } from "express";

import sessionController from "../controllers/session.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { createSessionValidator } from "../validators/session.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createSessionValidator,
  validate,
  sessionController.createSession,
);

router.get("/", protect, authorize("admin"), sessionController.getSessions);

export default router;
