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

const getMyClassSubjects = asyncHandler(async (req, res) => {
  const classSubjects = await classSubjectService.getMyClassSubjects(req.user);
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

const getClassSubject = asyncHandler(async (req, res) => {
  const classSubject = await classSubjectService.getClassSubject(req.params.id);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Class subject fetched successfully.",
        classSubject,
      ),
    );
});

const updateClassSubject = asyncHandler(async (req, res) => {
  const classSubject = await classSubjectService.updateClassSubject(
    req.params.id,
    req.body,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Class subject updated successfully.",
        classSubject,
      ),
    );
});

const deleteClassSubject = asyncHandler(async (req, res) => {
  await classSubjectService.deleteClassSubject(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Class subject removed successfully."));
});

export default {
  createClassSubject,
  getClassSubjects,
  getClassSubject,
  updateClassSubject,
  deleteClassSubject,
  getMyClassSubjects,
};
