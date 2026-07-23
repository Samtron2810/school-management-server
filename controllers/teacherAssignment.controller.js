import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import teacherAssignmentService from "../services/teacherAssignment.service.js";

const createTeacherAssignment = asyncHandler(async (req, res) => {
  const assignment = await teacherAssignmentService.createTeacherAssignment(
    req.body,
  );
  return res
    .status(201)
    .json(new ApiResponse(201, "Teacher assigned successfully.", assignment));
});

const getTeacherAssignments = asyncHandler(async (req, res) => {
  const assignments = await teacherAssignmentService.getTeacherAssignments();
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Assignments fetched successfully.", assignments),
    );
});

const getMyTeacherAssignments = asyncHandler(async (req, res) => {
  const assignments =
    await teacherAssignmentService.getMyTeacherAssignments(req.user);
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Assignments fetched successfully.", assignments),
    );
});

const getTeacherAssignment = asyncHandler(async (req, res) => {
  const assignment = await teacherAssignmentService.getTeacherAssignment(
    req.params.id,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Assignment fetched successfully.", assignment),
    );
});

const updateTeacherAssignment = asyncHandler(async (req, res) => {
  const assignment = await teacherAssignmentService.updateTeacherAssignment(
    req.params.id,
    req.body,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Assignment updated successfully.", assignment),
    );
});

const deleteTeacherAssignment = asyncHandler(async (req, res) => {
  await teacherAssignmentService.deleteTeacherAssignment(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Assignment deleted successfully."));
});

const getAssignmentStudents = asyncHandler(async (req, res) => {
  const students = await teacherAssignmentService.getAssignmentStudents(
    req.params.id,
    req.user,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Students fetched successfully.", students),
    );
});

export default {
  createTeacherAssignment,
  getTeacherAssignments,
  getTeacherAssignment,
  updateTeacherAssignment,
  deleteTeacherAssignment,
  getMyTeacherAssignments,
  getAssignmentStudents,
};
