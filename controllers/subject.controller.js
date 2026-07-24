import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import subjectService from "../services/subject.service.js";

const createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Subject created successfully.", subject));
});

const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await subjectService.getSubjects();

  return res
    .status(200)
    .json(new ApiResponse(200, "Subjects fetched successfully.", subjects));
});

export default {
  createSubject,
  getSubjects,
};
