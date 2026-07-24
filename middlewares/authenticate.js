import jwt from "jsonwebtoken";

import env from "../config/env.js";

import AccessTokenBlacklist from "../models/AccessTokenBlacklist.js";
import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";

import asyncHandler from "../utils/asyncHandler.js";

const getAccessTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return req.cookies?.accessToken ?? null;
};

const isTokenBlacklisted = async (jti) => {
  if (!jti) {
    return false;
  }

  const entry = await AccessTokenBlacklist.findOne({
    jti,
  });

  return Boolean(entry);
};

const authenticate = asyncHandler(async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);

  if (!token) {
    throw new ApiError(401, "Access denied. No token provided.");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token.");
  }

  if (decoded.tokenType && decoded.tokenType !== "access") {
    throw new ApiError(401, "Invalid access token.");
  }

  const user = await User.findById(decoded.id);

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

  if (await isTokenBlacklisted(decoded.jti)) {
    throw new ApiError(401, "This session has been revoked.");
  }

  req.accessToken = token;
  req.accessTokenPayload = decoded;
  req.user = user;

  next();
});

export default authenticate;
