import bcrypt from "bcryptjs";
import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";

import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";

const login = async ({ identifier, password }) => {
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
    ],
  }).select("+password +refreshToken +failedLoginAttempts +lockUntil");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Check if account is currently locked
  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new ApiError(
      423,
      `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`,
    );
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account has been deactivated");
  }

  const passwordMatch = await user.comparePassword(password);

  if (!passwordMatch) {
    await user.incrementLoginAttempts();
    logger.warn({
      type: "auth",
      event: "login_failed",
      userId: user._id,
      username: user.username,
      attempts: (user.failedLoginAttempts || 0) + 1,
    });
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user);

  user.refreshToken = await bcrypt.hash(refreshToken, 12);

  user.lastLogin = new Date();

  await user.save();

  // Reset failed attempts after successful login
  await user.resetLoginAttempts();

  logger.info({
    type: "auth",
    event: "login_success",
    userId: user._id,
    username: user.username,
    role: user.role,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export default {
  login,
};
