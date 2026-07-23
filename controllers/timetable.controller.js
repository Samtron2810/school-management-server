import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import timetableService from "../services/timetable.service.js";

const createTimetableEntry = asyncHandler(async (req, res) => {
  const entry = await timetableService.createTimetableEntry(req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, "Timetable entry created successfully.", entry));
});

const getMyTimetable = asyncHandler(async (req, res) => {
  const timetable = await timetableService.getMyTimetable(req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, "Timetable fetched successfully.", timetable));
});

const getClassTimetable = asyncHandler(async (req, res) => {
  const timetable = await timetableService.getClassTimetable(
    req.params.schoolClassId,
    req.query,
    req.user,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Timetable fetched successfully.", timetable));
});

const updateTimetableEntry = asyncHandler(async (req, res) => {
  const entry = await timetableService.updateTimetableEntry(
    req.params.id,
    req.body,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Timetable entry updated successfully.", entry));
});

const deleteTimetableEntry = asyncHandler(async (req, res) => {
  await timetableService.deleteTimetableEntry(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Timetable entry deleted successfully."));
});

export default {
  createTimetableEntry,
  getMyTimetable,
  getClassTimetable,
  updateTimetableEntry,
  deleteTimetableEntry,
};
