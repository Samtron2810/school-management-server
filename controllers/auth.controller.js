import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import env from "../config/env.js";

import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

import authService from "../services/auth.service.js";

import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.login({
    identifier,
    password,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      user,
      accessToken,
    }),
  );
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new ApiError(401, "Refresh token is required.");
  }

  const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user) {
    throw new ApiError(401, "User not found.");
  }

  const valid = await user.compareRefreshToken(token);

  if (!valid) {
    throw new ApiError(401, "Invalid refresh token.");
  }

  const accessToken = generateAccessToken(user);

  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = await bcrypt.hash(newRefreshToken, 12);

  await user.save();

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(
    new ApiResponse(200, "Token refreshed successfully", {
      accessToken,
    }),
  );
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (user) {
      user.refreshToken = undefined;

      await user.save();
    }
  }

  res.clearCookie("refreshToken");

  return res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});

const me = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", req.user));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect.");
  }

  user.password = newPassword;

  user.passwordChangedAt = new Date();

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully."));
});

export default {
  login,
  refreshToken,
  logout,
  me,
  changePassword,
};
