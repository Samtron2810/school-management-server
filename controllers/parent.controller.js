import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import parentService from "../services/parent.service.js";

const createParent = asyncHandler(async (req, res) => {
  const parent = await parentService.createParent(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Parent created successfully.", parent));
});

const getParents = asyncHandler(async (req, res) => {
  const parents = await parentService.getParents();

  return res
    .status(200)
    .json(new ApiResponse(200, "Parents fetched successfully.", parents));
});

const getParentById = asyncHandler(async (req, res) => {
  const parent = await parentService.getParentById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Parent fetched successfully.", parent));
});

export default {
  createParent,
  getParents,
  getParentById,
};
