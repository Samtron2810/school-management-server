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


import crypto from "crypto";
import { sendMail } from "../config/mailer.js";
import { emailVerificationTemplate } from "../utils/emailTemplates.js";
import env from "../config/env.js";

const EMAIL_VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000;

const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

const verifyEmail = async ({ token }) => {
  const hash = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hash,
    emailVerificationExpires: { $gt: Date.now() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw new ApiError(400, "Verification link is invalid or has expired.");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  logger.info({ type: "auth", event: "email_verified", userId: user._id });
};

const resendVerificationEmail = async ({ userId }) => {
  const user = await User.findById(userId).select(
    "+emailVerificationToken +emailVerificationExpires",
  );

  if (!user) throw new ApiError(404, "User not found.");
  if (user.isEmailVerified) throw new ApiError(400, "Email is already verified.");

  const raw = crypto.randomBytes(32).toString("hex");
  const hash = hashToken(raw);

  user.emailVerificationToken = hash;
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRY_MS);
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${env.CLIENT_ORIGINS[0]}/verify-email?token=${raw}`;
  const { subject, html } = emailVerificationTemplate({
    firstName: user.firstName,
    verifyUrl,
    role: user.role,
  });

  try {
    await sendMail({ to: user.email, toName: user.firstName, subject, html });
    logger.info({ type: "auth", event: "verification_email_resent", userId: user._id });
  } catch (err) {
    logger.error({ type: "auth", event: "verification_email_failed", userId: user._id, error: err.message });
    throw new ApiError(500, "Failed to send verification email. Please try again.");
  }
};

export default {
  login,
  verifyEmail,
  resendVerificationEmail,
};
