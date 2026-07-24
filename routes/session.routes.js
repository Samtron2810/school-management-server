import { Router } from "express";

import sessionController from "../controllers/session.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { createSessionValidator } from "../validators/session.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createSessionValidator,
  validateRequest,
  sessionController.createSession,
);

router.get("/", authenticate, authorize("admin"), sessionController.getSessions);

export default router;
