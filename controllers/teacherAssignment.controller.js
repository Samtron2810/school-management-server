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

export default {
  createTeacherAssignment,
  getTeacherAssignments,
};
