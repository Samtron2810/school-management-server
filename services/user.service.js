import crypto from "crypto";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { sendMail } from "../config/mailer.js";
import { emailVerificationTemplate } from "../utils/emailTemplates.js";
import env from "../config/env.js";
import logger from "../config/logger.js";

const EMAIL_VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const generateVerificationToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_EXPIRY_MS);
  return { raw, hash, expiresAt };
};

const createUser = async (data) => {
  const existing = await User.findOne({
    $or: [
      { email: data.email.toLowerCase() },
      { username: data.username.toLowerCase() },
    ],
  });

  if (existing) {
    throw new ApiError(
      400,
      "A user with this email or username already exists.",
    );
  }

  const { raw, hash, expiresAt } = generateVerificationToken();

  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
    username: data.username.toLowerCase(),
    isEmailVerified: false,
    emailVerificationToken: hash,
    emailVerificationExpires: expiresAt,
  });

  // Send verification email — non-blocking: account is created regardless.
  const verifyUrl = `${env.CLIENT_ORIGINS[0]}/verify-email?token=${raw}`;
  const { subject, html } = emailVerificationTemplate({
    firstName: user.firstName,
    verifyUrl,
    role: user.role,
  });

  sendMail({ to: user.email, toName: user.firstName, subject, html }).catch((err) => {
    logger.error({
      type: "auth",
      event: "verification_email_failed",
      userId: user._id,
      error: err.message,
    });
  });

  return user;
};

const getUsers = async () => {
  return await User.find().sort({ createdAt: -1 });
};

const getUser = async (userId) => {
  const user = await findDocumentOrFail(User, userId, "User");
  return user;
};

// Admin edit of account fields. Email/username changes are
// collision-checked against other users.
const updateUser = async (userId, data) => {
  const user = await findDocumentOrFail(User, userId, "User");

  const nextEmail = data.email ? data.email.toLowerCase() : user.email;
  const nextUsername = data.username
    ? data.username.toLowerCase()
    : user.username;

  if (nextEmail !== user.email || nextUsername !== user.username) {
    const conflict = await User.findOne({
      _id: { $ne: user._id },
      $or: [{ email: nextEmail }, { username: nextUsername }],
    });

    if (conflict) {
      throw new ApiError(
        400,
        "A user with this email or username already exists.",
      );
    }
  }

  for (const field of [
    "firstName",
    "lastName",
    "otherName",
    "phoneNumber",
    "role",
  ]) {
    if (data[field] !== undefined) user[field] = data[field];
  }

  user.email = nextEmail;
  user.username = nextUsername;

  await user.save();

  return user;
};

// Activate/deactivate an account. Deactivation blocks login and existing
// tokens (protect middleware rejects inactive users).
const updateUserStatus = async (userId, isActive, requester) => {
  if (userId.toString() === requester._id.toString() && isActive === false) {
    throw new ApiError(400, "You cannot deactivate your own account.");
  }

  const user = await findDocumentOrFail(User, userId, "User");
  user.isActive = Boolean(isActive);
  await user.save();

  return user;
};

// Admin password reset — mirrors change-password: invalidates the user's
// current sessions so they sign in with the new password.
const resetUserPassword = async (userId, newPassword, requester) => {
  if (userId.toString() === requester._id.toString()) {
    throw new ApiError(
      400,
      "Use the change-password endpoint to change your own password.",
    );
  }

  const user = await User.findById(userId).select("+refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.refreshToken = undefined;

  await user.save();

  return user;
};

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
};
