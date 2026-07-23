import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import settingService from "../services/setting.service.js";

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings();

  return res
    .status(200)
    .json(new ApiResponse(200, "School settings fetched successfully.", settings));
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.updateSettings(req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "School settings updated successfully.", settings));
});

export default {
  getSettings,
  updateSettings,
};
