import { Router } from "express";

import subjectScoreController from "../controllers/subjectScore.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import { bulkSaveScoresValidator } from "../validators/subjectScore.validator.js";

const router = Router();

// GET /subject-scores?schoolClass=&subject=&session=&term=
router.get(
  "/",
  protect,
  authorize("admin", "teacher"),
  subjectScoreController.getMarkEntryGrid,
);

// PUT /subject-scores/bulk — global save for the mark-entry grid.
router.put(
  "/bulk",
  protect,
  authorize("admin", "teacher"),
  bulkSaveScoresValidator,
  validate,
  subjectScoreController.bulkSaveScores,
);

export default router;
