import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { getRedis } from "../config/redis.js";
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
  if (!jti) return false;

  const redis = getRedis();

  if (redis) {
    // O(1) Redis EXISTS — no DB touch at all
    try {
      const exists = await redis.exists(`blacklist:${jti}`);
      return exists === 1;
    } catch {
      // Redis down — fall through to MongoDB
    }
  }

  // Fallback: MongoDB
  const { default: AccessTokenBlacklist } = await import(
    "../models/AccessTokenBlacklist.js"
  );
  const entry = await AccessTokenBlacklist.findOne({ jti });
  return Boolean(entry);
};

export const protect = asyncHandler(async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);
  if (!token) throw new ApiError(401, "Access denied. No token provided.");

  let decoded;
  try {
    decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired access token.");
  }

  if (decoded.tokenType && decoded.tokenType !== "access") {
    throw new ApiError(401, "Invalid access token.");
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, "User not found.");
  if (!user.isActive) throw new ApiError(403, "Your account has been deactivated.");

  const tokenVersion = decoded.tokenVersion ?? 0;
  if ((user.tokenVersion ?? 0) !== tokenVersion) {
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (
    user.passwordChangedAt &&
    decoded.iat &&
    Math.floor(user.passwordChangedAt.getTime() / 1000) > decoded.iat
  ) {
    throw new ApiError(401, "Your password has changed. Please sign in again.");
  }

  if (await isTokenBlacklisted(decoded.jti)) {
    throw new ApiError(401, "This session has been revoked.");
  }

  req.accessToken = token;
  req.accessTokenPayload = decoded;
  req.user = user;

  next();
});

export const authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You are not authorized to perform this action.");
    }
    next();
  });
};
