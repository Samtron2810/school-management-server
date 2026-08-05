import { Router } from "express";

import resultController from "../controllers/result.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import { heavyReadLimiter } from "../middlewares/rateLimiters.js";

const router = Router();

router.get("/", protect, resultController.getResults);
// Bulk: every student in a class (admins/teachers) — throttled.
router.get(
  "/report-cards",
  heavyReadLimiter,
  protect,
  authorize("admin", "teacher"),
  resultController.generateClassReportCards,
);
router.get(
  "/report-card/:studentId",
  heavyReadLimiter,
  protect,
  resultController.generateReportCard,
);
router.get("/:id", protect, resultController.getResultById);
router.post(
  "/",
  protect,
  authorize("admin", "teacher"),
  resultController.createResult,
);
router.post(
  "/attempts/:attemptId",
  protect,
  authorize("admin", "teacher"),
  resultController.createResultFromAttempt,
);
router.post(
  "/compute-grade",
  protect,
  authorize("admin", "teacher"),
  resultController.computeGrade,
);
router.patch(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  resultController.updateResult,
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  resultController.deleteResult,
);

export default router;
