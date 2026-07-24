import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import userService from "../services/user.service.js";

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully.", user));
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getUsers();

  return res
    .status(200)
    .json(new ApiResponse(200, "Users fetched successfully.", users));
});

export default {
  createUser,
  getUsers,
};
