import asyncHandler from "../utils/asyncHandler.js";

import studentAttemptService from "../services/studentAttempt.service.js";

/*
|--------------------------------------------------------------------------
| Start Assessment
|--------------------------------------------------------------------------
*/

export const startAssessment = asyncHandler(async (req, res) => {
  const attempt = await studentAttemptService.startAssessment(
    req.body,
    req.user,
  );

  return res.status(201).json({
    success: true,
    message: "Assessment started successfully.",
    data: attempt,
  });
});

/*
|--------------------------------------------------------------------------
| Submit Assessment
|--------------------------------------------------------------------------
*/

export const submitAssessment = asyncHandler(async (req, res) => {
  const attempt = await studentAttemptService.submitAssessment(
    req.params.id,
    req.user,
  );

  return res.json({
    success: true,
    message: "Assessment submitted successfully.",
    data: attempt,
  });
});

/*
|--------------------------------------------------------------------------
| Get Attempt
|--------------------------------------------------------------------------
*/

export const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await studentAttemptService.getStudentAttempt(
    req.params.id,
    req.user,
  );

  return res.json({
    success: true,
    data: attempt,
  });
});

/*
|--------------------------------------------------------------------------
| Get Attempts
|--------------------------------------------------------------------------
*/

export const getAttempts = asyncHandler(async (req, res) => {
  const attempts = await studentAttemptService.getStudentAttempts(req.user);

  return res.json({
    success: true,
    data: attempts,
  });
});

/*
|--------------------------------------------------------------------------
| Auto Submit
|--------------------------------------------------------------------------
*/

export const autoSubmit = asyncHandler(async (req, res) => {
  const attempt = await studentAttemptService.autoSubmitAssessment(
    req.params.id,
  );

  return res.json({
    success: true,
    message: "Assessment auto-submitted.",
    data: attempt,
  });
});

export const getAttemptQuestions = asyncHandler(async (req, res) => {
  const questions = await studentAttemptService.getAttemptQuestions(
    req.params.id,
    req.user,
  );

  return res.json({
    success: true,
    data: questions,
  });
});
