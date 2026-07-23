import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import teacherService from "../services/teacher.service.js";

const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacher(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Teacher created successfully.", teacher));
});

const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await teacherService.getTeachers();

  return res
    .status(200)
    .json(new ApiResponse(200, "Teachers fetched successfully.", teachers));
});

const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacher(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Teacher fetched successfully.", teacher));
});

const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.updateTeacher(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "Teacher updated successfully.", teacher));
});

export default {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
};
