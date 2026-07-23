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

const getSession = asyncHandler(async (req, res) => {
  const session = await sessionService.getSession(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Session fetched successfully.", session));
});

const updateSession = asyncHandler(async (req, res) => {
  const session = await sessionService.updateSession(req.params.id, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, "Session updated successfully.", session));
});

const deleteSession = asyncHandler(async (req, res) => {
  await sessionService.deleteSession(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Session deleted successfully."));
});

export default {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
};
