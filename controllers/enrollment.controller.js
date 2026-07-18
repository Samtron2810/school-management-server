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

export default {
  createEnrollment,
  getEnrollments,
};
