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

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully.", user));
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "User updated successfully.", user));
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateUserStatus(
    req.params.id,
    req.body.isActive,
    req.user,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
        user,
      ),
    );
});

const resetUserPassword = asyncHandler(async (req, res) => {
  await userService.resetUserPassword(
    req.params.id,
    req.body.newPassword,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset successfully."));
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
};
