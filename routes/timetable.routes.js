import { Router } from "express";

import timetableController from "../controllers/timetable.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import {
  createTimetableValidator,
  updateTimetableValidator,
} from "../validators/timetable.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createTimetableValidator,
  validate,
  timetableController.createTimetableEntry,
);

// Role-scoped: teacher → own periods, student/parent → class periods.
router.get("/my", protect, timetableController.getMyTimetable);

router.get(
  "/class/:schoolClassId",
  protect,
  authorize("admin", "teacher"),
  timetableController.getClassTimetable,
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateTimetableValidator,
  validate,
  timetableController.updateTimetableEntry,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  timetableController.deleteTimetableEntry,
);

export default router;
