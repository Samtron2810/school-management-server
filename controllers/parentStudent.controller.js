import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import parentStudentService from "../services/parentStudent.service.js";

const linkParentStudent = asyncHandler(async (req, res) => {
  const relationship = await parentStudentService.linkParentStudent(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Parent linked successfully.", relationship));
});

const getParentsOfStudent = asyncHandler(async (req, res) => {
  const data = await parentStudentService.getParentsOfStudent(
    req.params.studentId,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Parents fetched successfully.", data));
});

const getChildrenOfParent = asyncHandler(async (req, res) => {
  const data = await parentStudentService.getChildrenOfParent(
    req.params.parentId,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Children fetched successfully.", data));
});

const removeParentStudent = asyncHandler(async (req, res) => {
  const data = await parentStudentService.removeParentStudent(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Relationship removed successfully.", data));
});

export default {
  linkParentStudent,
  getParentsOfStudent,
  getChildrenOfParent,
  removeParentStudent,
};
