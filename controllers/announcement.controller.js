import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import announcementService from "../services/announcement.service.js";

const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement(
    req.body,
    req.user,
  );

  return res
    .status(201)
    .json(new ApiResponse(201, "Announcement created successfully.", announcement));
});

const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await announcementService.getAnnouncements(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Announcements fetched successfully.", announcements));
});

const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await announcementService.getAnnouncementById(
    req.params.id,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Announcement fetched successfully.", announcement));
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.updateAnnouncement(
    req.params.id,
    req.body,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Announcement updated successfully.", announcement));
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.deleteAnnouncement(
    req.params.id,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Announcement deleted successfully.", announcement));
});

export default {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};
