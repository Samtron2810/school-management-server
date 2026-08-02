import { Router } from "express";

import reportCardController from "../controllers/reportCard.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import { setStudentPublishStateValidator } from "../validators/reportCard.validator.js";
import { heavyReadLimiter } from "../middlewares/rateLimiters.js";

const router = Router();

// GET /report-cards?schoolClass=&session=&term= — admin/teacher list view.
router.get(
  "/",
  heavyReadLimiter,
  protect,
  authorize("admin", "teacher"),
  reportCardController.listClassReportCards,
);

// POST /report-cards/:schoolClassId/publish — publish a whole class.
router.post(
  "/:schoolClassId/publish",
  protect,
  authorize("admin", "teacher"),
  reportCardController.publishClassReportCards,
);

// POST /report-cards/:schoolClassId/unpublish — withdraw a whole class.
router.post(
  "/:schoolClassId/unpublish",
  protect,
  authorize("admin", "teacher"),
  reportCardController.unpublishClassReportCards,
);

// PATCH /report-cards/:studentId/publish — per-student override.
router.patch(
  "/:studentId/publish",
  protect,
  authorize("admin", "teacher"),
  setStudentPublishStateValidator,
  validate,
  reportCardController.setStudentReportCardPublishState,
);

// POST /report-cards/bulk-download — zip of multiple students' PDFs.
// Kept before "/:studentId" so it isn't swallowed by the param route.
router.post(
  "/bulk-download",
  heavyReadLimiter,
  protect,
  reportCardController.downloadBulkReportCards,
);

// GET /report-cards/:studentId/download — single PDF.
router.get(
  "/:studentId/download",
  heavyReadLimiter,
  protect,
  reportCardController.downloadStudentReportCard,
);

// GET /report-cards/:studentId — staff (any time) or the
// student/parent themselves (only once published). Kept last so it
// doesn't swallow the more specific routes above.
router.get("/:studentId", heavyReadLimiter, protect, reportCardController.getStudentReportCard);

export default router;
