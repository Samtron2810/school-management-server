import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import dashboardService from "../services/dashboard.service.js";

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getDashboard(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Dashboard fetched successfully.", dashboard));
});

export default {
  getDashboard,
};
