import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import enrollmentService from "../services/enrollment.service.js";

const createEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentService.createEnrollment(req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, "Student enrolled successfully.", enrollment));
});

const getEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await enrollmentService.getEnrollments();
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Enrollments fetched successfully.", enrollments),
    );
});

const getEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentService.getEnrollment(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Enrollment fetched successfully.", enrollment));
});

const updateEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentService.updateEnrollment(
    req.params.id,
    req.body,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Enrollment updated successfully.", enrollment));
});

const deleteEnrollment = asyncHandler(async (req, res) => {
  await enrollmentService.deleteEnrollment(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Enrollment deleted successfully."));
});

export default {
  createEnrollment,
  getEnrollments,
  getEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
