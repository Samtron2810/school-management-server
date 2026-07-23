import { Router } from "express";

import resultController from "../controllers/result.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

const router = Router();

router.get("/", authenticate, resultController.getResults);
// Bulk: every student in a class (admins/teachers).
router.get(
  "/report-cards",
  authenticate,
  authorize("admin", "teacher"),
  resultController.generateClassReportCards,
);
router.get(
  "/report-card/:studentId",
  authenticate,
  resultController.generateReportCard,
);
router.get("/:id", authenticate, resultController.getResultById);
router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  resultController.createResult,
);
router.post(
  "/attempts/:attemptId",
  authenticate,
  authorize("admin", "teacher"),
  resultController.createResultFromAttempt,
);
router.post(
  "/compute-grade",
  authenticate,
  authorize("admin", "teacher"),
  resultController.computeGrade,
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  resultController.updateResult,
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  resultController.deleteResult,
);

export default router;
