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

const updateParent = asyncHandler(async (req, res) => {
  const parent = await parentService.updateParent(req.params.id, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, "Parent updated successfully.", parent));
});

const getMyChildren = asyncHandler(async (req, res) => {
  const children = await parentService.getMyChildren(req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, "Children fetched successfully.", children));
});

export default {
  createParent,
  getParents,
  getParentById,
  updateParent,
  getMyChildren,
};
