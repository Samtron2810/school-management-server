import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import subjectScoreService from "../services/subjectScore.service.js";

const getMarkEntryGrid = asyncHandler(async (req, res) => {
  const grid = await subjectScoreService.getMarkEntryGrid(req.query, req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, "Mark entry grid fetched successfully.", grid));
});

const bulkSaveScores = asyncHandler(async (req, res) => {
  const result = await subjectScoreService.bulkSaveScores(req.body, req.user);
  const message =
    result.failedCount === 0
      ? `${result.savedCount} score(s) saved successfully.`
      : `${result.savedCount} score(s) saved, ${result.failedCount} failed.`;
  return res.status(200).json(new ApiResponse(200, message, result));
});

export default {
  getMarkEntryGrid,
  bulkSaveScores,
};
