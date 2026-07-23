import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import attendanceService from "../services/attendance.service.js";

/*
|--------------------------------------------------------------------------
| Mark Attendance
|--------------------------------------------------------------------------
*/

const markAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.markAttendance(req.body, req.user);

  return res
    .status(201)
    .json(new ApiResponse(201, "Attendance marked successfully.", attendance));
});

/*
|--------------------------------------------------------------------------
| Get Attendance By Date
|--------------------------------------------------------------------------
*/

const getAttendanceByDate = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.getAttendanceByDate(
    req.params.teacherAssignmentId,
    req.query.date,
    req.user,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Attendance retrieved successfully.", attendance),
    );
});

/*
|--------------------------------------------------------------------------
| Get Student Attendance
|--------------------------------------------------------------------------
*/

const getStudentAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.getStudentAttendance(
    req.params.studentId,
    req.user,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Student attendance retrieved successfully.",
        attendance,
      ),
    );
});

/*
|--------------------------------------------------------------------------
| Attendance Summary
|--------------------------------------------------------------------------
*/

const getAttendanceSummary = asyncHandler(async (req, res) => {
  const summary = await attendanceService.getAttendanceSummary(
    req.params.studentId,
    req.user,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Attendance summary retrieved successfully.",
        summary,
      ),
    );
});

/*
|--------------------------------------------------------------------------
| Update Attendance
|--------------------------------------------------------------------------
*/

const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.updateAttendance(
    req.params.id,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Attendance updated successfully.", attendance));
});

/*
|--------------------------------------------------------------------------
| Delete Attendance
|--------------------------------------------------------------------------
*/

const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.deleteAttendance(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Attendance deleted successfully.", attendance));
});

// Daily register for a whole class (admin/teacher).
const getClassRegister = asyncHandler(async (req, res) => {
  const register = await attendanceService.getClassRegister(
    req.query.schoolClass,
    req.query.date,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Class register fetched successfully.", register));
});

// Date-range attendance summary per student for a class (admin/teacher).
const getClassAttendanceSummary = asyncHandler(async (req, res) => {
  const summary = await attendanceService.getClassAttendanceSummary(
    req.query.schoolClass,
    req.query,
    req.user,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Class attendance summary fetched successfully.", summary),
    );
});

export default {
  markAttendance,

  getAttendanceByDate,

  getStudentAttendance,

  getAttendanceSummary,

  getClassRegister,

  getClassAttendanceSummary,

  updateAttendance,

  deleteAttendance,
};
