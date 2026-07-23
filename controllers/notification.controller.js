import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import notificationService from "../services/notification.service.js";

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getMyNotifications(
    req.user,
    req.query,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Notifications fetched successfully.", notifications));
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Notification marked as read.", notification));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "All notifications marked as read."));
});

export default {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
