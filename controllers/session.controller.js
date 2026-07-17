import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import sessionService from "../services/session.service.js";

const createSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createSession(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Session created successfully.", session));
});

const getSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.getSessions();

  return res
    .status(200)
    .json(new ApiResponse(200, "Sessions fetched successfully.", sessions));
});

export default {
  createSession,
  getSessions,
};
