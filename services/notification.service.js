import mongoose from "mongoose";

import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Parent from "../models/Parent.js";
import ParentStudent from "../models/ParentStudent.js";

/*
|--------------------------------------------------------------------------
| Emission helpers (used by other services; failures should never break the
| primary operation — callers wrap them in try/catch)
|--------------------------------------------------------------------------
*/

// Fan out one notification to many users at once (duplicates ignored by caller).
const notifyUsers = async (userIds, { title, message, type = "general", link = "" }) => {
  const uniqueIds = [
    ...new Set(
      (userIds || [])
        .filter(Boolean)
        .map((id) => (id?._id ?? id).toString()),
    ),
  ];

  if (uniqueIds.length === 0) return [];

  const docs = uniqueIds.map((userId) => ({
    user: userId,
    title,
    message,
    type,
    link,
  }));

  return await Notification.insertMany(docs);
};

// Everyone with one of the given roles (active users only).
const notifyRoles = async (roles, payload) => {
  if (!Array.isArray(roles) || roles.length === 0) return [];

  const users = await User.find({
    role: { $in: roles },
    isActive: true,
  }).select("_id");

  return await notifyUsers(
    users.map((user) => user._id),
    payload,
  );
};

// The user behind a Student doc + every linked parent's user.
const notifyStudentAndParents = async (studentId, payload) => {
  const student = await Student.findById(studentId).select("user");
  if (!student) return [];

  const links = await ParentStudent.find({
    student: student._id,
    isActive: true,
  }).select("parent");

  const parentIds = links.map((link) => link.parent);
  const parents = parentIds.length
    ? await Parent.find({ _id: { $in: parentIds } }).select("user")
    : [];

  const userIds = [student.user, ...parents.map((parent) => parent.user)];

  return await notifyUsers(userIds, payload);
};

/*
|--------------------------------------------------------------------------
| Reads (for the notifications UI)
|--------------------------------------------------------------------------
*/

const getMyNotifications = async (user, query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { user: user._id };
  if (query.unread === "true") filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: user._id, isRead: false }),
  ]);

  return {
    items,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const markAsRead = async (notificationId, user) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return null;
  }

  return await Notification.findOneAndUpdate(
    { _id: notificationId, user: user._id },
    { isRead: true },
    { new: true },
  );
};

const markAllAsRead = async (user) => {
  return await Notification.updateMany(
    { user: user._id, isRead: false },
    { isRead: true },
  );
};

export default {
  notifyUsers,
  notifyRoles,
  notifyStudentAndParents,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
