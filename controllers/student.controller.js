import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import studentService from "../services/student.service.js";

const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Student created successfully.", student));
});

const getStudents = asyncHandler(async (req, res) => {
  const students = await studentService.getStudents();

  return res
    .status(200)
    .json(new ApiResponse(200, "Students fetched successfully.", students));
});

const getStudent = asyncHandler(async (req, res) => {
  const student = await studentService.getStudent(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Student fetched successfully.", student));
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "Student updated successfully.", student));
});

export default {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
};
