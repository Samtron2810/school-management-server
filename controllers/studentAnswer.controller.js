import asyncHandler from "../utils/asyncHandler.js";

import studentAnswerService from "../services/studentAnswer.service.js";

/*
|--------------------------------------------------------------------------
| Save Answer
|--------------------------------------------------------------------------
*/

export const saveAnswer = asyncHandler(async (req, res) => {
  const answer = await studentAnswerService.saveAnswer(req.body, req.user);

  return res.status(201).json({
    success: true,
    message: "Answer saved successfully.",
    data: answer,
  });
});

/*
|--------------------------------------------------------------------------
| Clear Answer
|--------------------------------------------------------------------------
*/

export const clearAnswer = asyncHandler(async (req, res) => {
  const answer = await studentAnswerService.clearAnswer(
    req.params.attemptId,
    req.params.questionId,
    req.user,
  );

  return res.json({
    success: true,
    message: "Answer cleared successfully.",
    data: answer,
  });
});

/*
|--------------------------------------------------------------------------
| Get Answer
|--------------------------------------------------------------------------
*/

export const getAnswer = asyncHandler(async (req, res) => {
  const answer = await studentAnswerService.getAnswer(
    req.params.attemptId,
    req.params.questionId,
    req.user,
  );

  return res.json({
    success: true,
    data: answer,
  });
});

/*
|--------------------------------------------------------------------------
| Get Answers
|--------------------------------------------------------------------------
*/

export const getAnswers = asyncHandler(async (req, res) => {
  const answers = await studentAnswerService.getAnswers(
    req.params.attemptId,
    req.user,
  );

  return res.json({
    success: true,
    data: answers,
  });
});

/*
|--------------------------------------------------------------------------
| Review Answers
|--------------------------------------------------------------------------
*/

export const reviewAnswers = asyncHandler(async (req, res) => {
  const result = await studentAnswerService.reviewAnswers(
    req.params.attemptId,
    req.user,
  );

  return res.json({
    success: true,
    data: result,
  });
});
