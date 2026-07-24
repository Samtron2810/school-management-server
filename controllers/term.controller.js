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

export default {
  createTerm,
  getTerms,
};
