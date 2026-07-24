import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import env from "../config/env.js";

import AccessTokenBlacklist from "../models/AccessTokenBlacklist.js";
import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

import authService from "../services/auth.service.js";

import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  CSRF_TOKEN_COOKIE_NAME,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from "../config/authCookies.js";
import { generateCsrfToken } from "../config/csrf.js";

const getAccessTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return req.cookies?.[ACCESS_TOKEN_COOKIE_NAME] ?? null;
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, getAccessTokenCookieOptions());
  res.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    getRefreshTokenCookieOptions(),
  );
};

const clearAuthCookies = (res) => {
  const clearOptions = getClearCookieOptions();

  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, clearOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, clearOptions);
  res.clearCookie(CSRF_TOKEN_COOKIE_NAME, clearOptions);
};

const blacklistAccessToken = async (token, userId) => {
  if (!token) {
    return;
  }

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

    if (decoded.tokenType && decoded.tokenType !== "access") {
      return;
    }

    if (!decoded.jti || !decoded.exp) {
      return;
    }

    await AccessTokenBlacklist.updateOne(
      {
        jti: decoded.jti,
      },
      {
        $setOnInsert: {
          jti: decoded.jti,
          user: userId,
          reason: "logout",
          expiresAt: new Date(decoded.exp * 1000),
        },
      },
      {
        upsert: true,
      },
    );
  } catch (error) {
    return;
  }
};

const generateSessionCsrfToken = (req, res, refreshToken) => {
  req.cookies = req.cookies || {};
  req.cookies[REFRESH_TOKEN_COOKIE_NAME] = refreshToken;

  return generateCsrfToken(req, res, {
    overwrite: true,
  });
};

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.login({
    identifier,
    password,
  });

  setAuthCookies(res, accessToken, refreshToken);

  const csrfToken = generateSessionCsrfToken(req, res, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      user,
      accessToken,
      csrfToken,
    }),
  );
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

  if (!token) {
    throw new ApiError(401, "Refresh token is required.");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  if (decoded.tokenType && decoded.tokenType !== "refresh") {
    throw new ApiError(401, "Invalid refresh token.");
  }

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user) {
    throw new ApiError(401, "User not found.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated.");
  }

  const tokenVersion = decoded.tokenVersion ?? 0;

  if ((user.tokenVersion ?? 0) !== tokenVersion) {
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (
    user.passwordChangedAt &&
    decoded.iat &&
    Math.floor(user.passwordChangedAt.getTime() / 1000) > decoded.iat
  ) {
    throw new ApiError(
      401,
      "Your password has changed. Please sign in again.",
    );
  }

  const valid = await user.compareRefreshToken(token);

  if (!valid) {
    throw new ApiError(401, "Invalid refresh token.");
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = await bcrypt.hash(newRefreshToken, 12);

  await user.save();

  setAuthCookies(res, accessToken, newRefreshToken);

  const csrfToken = generateSessionCsrfToken(req, res, newRefreshToken);

  return res.status(200).json(
    new ApiResponse(200, "Token refreshed successfully", {
      accessToken,
      csrfToken,
    }),
  );
});

const logout = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  const accessTokenValue = getAccessTokenFromRequest(req);

  if (refreshTokenValue) {
    try {
      const decodedRefresh = jwt.verify(
        refreshTokenValue,
        env.REFRESH_TOKEN_SECRET,
      );

      const user = await User.findById(decodedRefresh.id).select("+refreshToken");

      if (user && user.refreshToken) {
        user.refreshToken = undefined;

        await user.save();

        if (accessTokenValue) {
          await blacklistAccessToken(accessTokenValue, user._id);
        }
      }
    } catch (error) {
      // Ignore invalid/expired refresh token on logout and still clear cookies.
    }
  }

  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});

const logoutAll = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+refreshToken");

  if (!user) {
    throw new ApiError(401, "User not found.");
  }

  const accessTokenValue = req.accessToken || getAccessTokenFromRequest(req);

  if (accessTokenValue) {
    await blacklistAccessToken(accessTokenValue, user._id);
  }

  user.refreshToken = undefined;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;

  await user.save();

  clearAuthCookies(res);

  return res
    .status(200)
    .json(new ApiResponse(200, "All sessions logged out successfully."));
});

const getCsrfToken = asyncHandler(async (req, res) => {
  const csrfToken = generateCsrfToken(req, res, {
    overwrite: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "CSRF token generated successfully.", {
        csrfToken,
      }),
    );
});

const me = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", req.user));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect.");
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.refreshToken = undefined;

  await user.save();

  clearAuthCookies(res);

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully."));
});

export default {
  login,
  refreshToken,
  logout,
  logoutAll,
  getCsrfToken,
  me,
  changePassword,
};
