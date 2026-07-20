import asyncHandler from "../utils/asyncHandler.js";

import questionService from "../services/question.service.js";

/*
|--------------------------------------------------------------------------
| Create Question
|--------------------------------------------------------------------------
*/

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.createQuestion(req.body, req.user);

  return res.status(201).json({
    success: true,
    message: "Question created successfully.",
    data: question,
  });
});

/*
|--------------------------------------------------------------------------
| Update Question
|--------------------------------------------------------------------------
*/

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.updateQuestion(
    req.params.id,
    req.body,
    req.user,
  );

  return res.json({
    success: true,
    message: "Question updated successfully.",
    data: question,
  });
});

/*
|--------------------------------------------------------------------------
| Delete Question
|--------------------------------------------------------------------------
*/

export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.deleteQuestion(
    req.params.id,
    req.user,
  );

  return res.json({
    success: true,
    message: "Question deleted successfully.",
    data: question,
  });
});

/*
|--------------------------------------------------------------------------
| Duplicate Question
|--------------------------------------------------------------------------
*/

export const duplicateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.duplicateQuestion(
    req.params.id,
    req.user,
  );

  return res.status(201).json({
    success: true,
    message: "Question duplicated successfully.",
    data: question,
  });
});

/*
|--------------------------------------------------------------------------
| Get Question
|--------------------------------------------------------------------------
*/

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.getQuestion(req.params.id);

  return res.json({
    success: true,
    data: question,
  });
});

/*
|--------------------------------------------------------------------------
| Get Questions
|--------------------------------------------------------------------------
*/

export const getQuestions = asyncHandler(async (req, res) => {
  const result = await questionService.getQuestions(req.query);

  return res.json({
    success: true,
    ...result,
  });
});

/*
|--------------------------------------------------------------------------
| Delete Questions
|--------------------------------------------------------------------------
*/

export const deleteQuestions = asyncHandler(async (req, res) => {
  const result = await questionService.deleteQuestions(
    req.body.questionIds,
    req.user,
  );

  return res.json({
    success: true,
    message: "Questions deleted successfully.",
    data: result,
  });
});
