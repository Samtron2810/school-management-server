import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import lessonService from "../services/lesson.service.js";

const createLesson = asyncHandler(async (req, res) => {
  const lesson = await lessonService.createLesson(
    req.body,
    req.files || [],
    req.user,
  );

  return res
    .status(201)
    .json(new ApiResponse(201, "Lesson created successfully.", lesson));
});

const getLessons = asyncHandler(async (req, res) => {
  const lessons = await lessonService.getLessons();

  return res
    .status(200)
    .json(new ApiResponse(200, "Lessons fetched successfully.", lessons));
});

const getMyLessons = asyncHandler(async (req, res) => {
  const lessons = await lessonService.getMyLessons(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Lessons fetched successfully.", lessons));
});

const getLessonById = asyncHandler(async (req, res) => {
  const lesson = await lessonService.getLessonById(req.params.id, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Lesson fetched successfully.", lesson));
});

const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await lessonService.updateLesson(
    req.params.id,
    req.body,
    req.files || [],
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Lesson updated successfully.", lesson));
});

const deleteLesson = asyncHandler(async (req, res) => {
  const result = await lessonService.deleteLesson(req.params.id, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Lesson deleted successfully.", result));
});

export default {
  createLesson,
  getLessons,
  getMyLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
};
