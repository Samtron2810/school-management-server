import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import classTeacherAssignmentService from "../services/classTeacherAssignment.service.js";

const assignClassTeacher = asyncHandler(async (req, res) => {
  const assignment = await classTeacherAssignmentService.assignClassTeacher(
    req.body,
  );
  return res
    .status(201)
    .json(new ApiResponse(201, "Class teacher assigned.", assignment));
});

const getClassTeacherAssignments = asyncHandler(async (req, res) => {
  const assignments =
    await classTeacherAssignmentService.getClassTeacherAssignments();
  return res
    .status(200)
    .json(new ApiResponse(200, "Class teachers fetched.", assignments));
});

const updateClassTeacherAssignment = asyncHandler(async (req, res) => {
  const assignment =
    await classTeacherAssignmentService.updateClassTeacherAssignment(
      req.params.id,
      req.body,
    );
  return res
    .status(200)
    .json(new ApiResponse(200, "Class teacher updated.", assignment));
});

const deleteClassTeacherAssignment = asyncHandler(async (req, res) => {
  await classTeacherAssignmentService.deleteClassTeacherAssignment(
    req.params.id,
  );
  return res.status(200).json(new ApiResponse(200, "Class teacher removed."));
});

export default {
  assignClassTeacher,
  getClassTeacherAssignments,
  updateClassTeacherAssignment,
  deleteClassTeacherAssignment,
};
