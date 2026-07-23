import { Router } from "express";

import attendanceController from "../controllers/attendance.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import { markAttendanceValidator } from "../validators/attendance.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Teacher & Admin
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  authorize("admin", "teacher"),
  markAttendanceValidator,
  validate,
  attendanceController.markAttendance,
);

router.patch(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  attendanceController.updateAttendance,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  attendanceController.deleteAttendance,
);

/*
|--------------------------------------------------------------------------
| Attendance Queries
|--------------------------------------------------------------------------
*/

router.get(
  "/date/:teacherAssignmentId",
  protect,
  authorize("admin", "teacher"),
  attendanceController.getAttendanceByDate,
);

router.get(
  "/student/:studentId",
  protect,
  authorize("admin", "teacher", "student", "parent"),
  attendanceController.getStudentAttendance,
);

// Daily register for a class: GET /attendance/register?schoolClass=&date=
router.get(
  "/register",
  protect,
  authorize("admin", "teacher"),
  attendanceController.getClassRegister,
);

// Class summary over a range: GET /attendance/summary?schoolClass=&from=&to=
router.get(
  "/summary",
  protect,
  authorize("admin", "teacher"),
  attendanceController.getClassAttendanceSummary,
);

router.get(
  "/summary/:studentId",
  protect,
  authorize("admin", "teacher", "student", "parent"),
  attendanceController.getAttendanceSummary,
);

export default router;
