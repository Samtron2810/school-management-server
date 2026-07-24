import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import resultService from "../services/result.service.js";

const createResult = asyncHandler(async (req, res) => {
  const result = await resultService.createResult(req.body, req.user);

  return res
    .status(201)
    .json(new ApiResponse(201, "Result created successfully.", result));
});

const updateResult = asyncHandler(async (req, res) => {
  const result = await resultService.updateResult(
    req.params.id,
    req.body,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Result updated successfully.", result));
});

const deleteResult = asyncHandler(async (req, res) => {
  const result = await resultService.deleteResult(req.params.id, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Result deleted successfully.", result));
});

const getResults = asyncHandler(async (req, res) => {
  const results = await resultService.getResults(req.query, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Results fetched successfully.", results));
});

const getResultById = asyncHandler(async (req, res) => {
  const result = await resultService.getResultById(req.params.id, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Result fetched successfully.", result));
});

const computeGrade = asyncHandler(async (req, res) => {
  const grading = resultService.computeGrade(
    req.body.score,
    req.body.totalMarks,
    req.body.percentage,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Grade computed successfully.", grading));
});

const generateReportCard = asyncHandler(async (req, res) => {
  const reportCard = await resultService.generateReportCard(
    req.params.studentId,
    req.query,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Report card generated successfully.", reportCard));
});

const createResultFromAttempt = asyncHandler(async (req, res) => {
  const result = await resultService.createFromAttempt(req.params.attemptId, req.user);

  return res
    .status(201)
    .json(new ApiResponse(201, "Result generated successfully.", result));
});

export default {
  createResult,
  updateResult,
  deleteResult,
  getResults,
  getResultById,
  computeGrade,
  generateReportCard,
  createResultFromAttempt,
};
