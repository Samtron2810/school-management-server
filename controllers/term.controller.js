import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import termService from "../services/term.service.js";

const createTerm = asyncHandler(async (req, res) => {
  const term = await termService.createTerm(req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, "Term created successfully.", term));
});

const getTerms = asyncHandler(async (req, res) => {
  const terms = await termService.getTerms();
  return res
    .status(200)
    .json(new ApiResponse(200, "Terms fetched successfully.", terms));
});

const getTerm = asyncHandler(async (req, res) => {
  const term = await termService.getTerm(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Term fetched successfully.", term));
});

const updateTerm = asyncHandler(async (req, res) => {
  const term = await termService.updateTerm(req.params.id, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, "Term updated successfully.", term));
});

const deleteTerm = asyncHandler(async (req, res) => {
  await termService.deleteTerm(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Term deleted successfully."));
});

export default {
  createTerm,
  getTerms,
  getTerm,
  updateTerm,
  deleteTerm,
};
