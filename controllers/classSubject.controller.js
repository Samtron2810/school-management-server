import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import classSubjectService from "../services/classSubject.service.js";

const createClassSubject = asyncHandler(async (req, res) => {
  const classSubject = await classSubjectService.createClassSubject(req.body);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Class subject assigned successfully.",
        classSubject,
      ),
    );
});

const getClassSubjects = asyncHandler(async (req, res) => {
  const classSubjects = await classSubjectService.getClassSubjects();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Class subjects fetched successfully.",
        classSubjects,
      ),
    );
});

export default {
  createClassSubject,
  getClassSubjects,
};
