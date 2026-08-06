import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import {
  generateResetToken,
  hashResetToken,
} from "../utils/passwordResetToken.js";
import { sendMail } from "../config/mailer.js";
import { passwordResetTemplate } from "../utils/emailTemplates.js";
import env from "../config/env.js";
import logger from "../config/logger.js";

/**
 * Initiate forgot-password flow.
 * Always responds 200 to avoid leaking whether the email exists.
 */
const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Silently succeed — never reveal if the email is registered
  if (!user || !user.isActive) return;

  const { raw, hash, expiresAt } = generateResetToken();

  user.passwordResetToken = hash;
  user.passwordResetExpires = expiresAt;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.EMAIL_URL}/reset-password?token=${raw}`;
  const { subject, html } = passwordResetTemplate({
    firstName: user.firstName,
    resetUrl,
  });

  try {
    await sendMail({ to: user.email, toName: user.firstName, subject, html });

    logger.info({
      type: "auth",
      event: "password_reset_requested",
      userId: user._id,
      email: user.email,
    });
  } catch (err) {
    // Roll back token if email fails so the user can try again
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error({
      type: "auth",
      event: "password_reset_email_failed",
      error: err.message,
    });
    throw new ApiError(
      500,
      "Failed to send reset email. Please try again later.",
    );
  }
};

/**
 * Complete reset — verify token, set new password.
 */
const resetPassword = async ({ token, newPassword }) => {
  const hash = hashResetToken(token);

  const user = await User.findOne({
    passwordResetToken: hash,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires +refreshToken");

  if (!user) {
    throw new ApiError(400, "Reset link is invalid or has expired.");
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Invalidate all existing sessions
  user.refreshToken = undefined;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;

  await user.save();

  logger.info({
    type: "auth",
    event: "password_reset_completed",
    userId: user._id,
  });
};

export default { forgotPassword, resetPassword };
