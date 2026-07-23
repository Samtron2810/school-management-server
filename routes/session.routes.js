import { Router } from "express";

import sessionController from "../controllers/session.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import {
  createSessionValidator,
  updateSessionValidator,
} from "../validators/session.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createSessionValidator,
  validate,
  sessionController.createSession,
);

// Reads are open to every signed-in role (report cards, manual results,
// filters) — writes stay admin-only.
router.get("/", protect, sessionController.getSessions);

router.get("/:id", protect, sessionController.getSession);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateSessionValidator,
  validate,
  sessionController.updateSession,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  sessionController.deleteSession,
);

export default router;
