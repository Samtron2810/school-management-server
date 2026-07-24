import { Router } from "express";

import attendanceController from "../controllers/attendance.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import validateRequest from "../middlewares/validateRequest.js";

import { markAttendanceValidator } from "../validators/attendance.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Teacher & Admin
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  markAttendanceValidator,
  validateRequest,
  attendanceController.markAttendance,
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  attendanceController.updateAttendance,
);

router.delete(
  "/:id",
  authenticate,
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
  authenticate,
  authorize("admin", "teacher"),
  attendanceController.getAttendanceByDate,
);

router.get(
  "/student/:studentId",
  authenticate,
  authorize("admin", "teacher", "student", "parent"),
  attendanceController.getStudentAttendance,
);

router.get(
  "/summary/:studentId",
  authenticate,
  authorize("admin", "teacher", "student", "parent"),
  attendanceController.getAttendanceSummary,
);

export default router;
