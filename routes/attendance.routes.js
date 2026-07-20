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

router.get(
  "/summary/:studentId",
  protect,
  authorize("admin", "teacher", "student", "parent"),
  attendanceController.getAttendanceSummary,
);

export default router;
