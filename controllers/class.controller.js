import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import classService from "../services/class.service.js";

const createClass = asyncHandler(async (req, res) => {
  const schoolClass = await classService.createClass(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Class created successfully.", schoolClass));
});

const getClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getClasses();

  return res
    .status(200)
    .json(new ApiResponse(200, "Classes fetched successfully.", classes));
});

export default {
  createClass,
  getClasses,
};
