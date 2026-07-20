import asyncHandler from "../utils/asyncHandler.js";

import assessmentService from "../services/assessment.service.js";

/*
|--------------------------------------------------------------------------
| Create Assessment
|--------------------------------------------------------------------------
*/

export const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.createAssessment(
    req.body,
    req.user,
  );

  return res.status(201).json({
    success: true,
    message: "Assessment created successfully.",
    data: assessment,
  });
});

/*
|--------------------------------------------------------------------------
| Update Assessment
|--------------------------------------------------------------------------
*/

export const updateAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.updateAssessment(
    req.params.id,
    req.body,
    req.user,
  );

  return res.json({
    success: true,
    message: "Assessment updated successfully.",
    data: assessment,
  });
});

/*
|--------------------------------------------------------------------------
| Publish Assessment
|--------------------------------------------------------------------------
*/

export const publishAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.publishAssessment(
    req.params.id,
    req.user,
  );

  return res.json({
    success: true,
    message: "Assessment published successfully.",
    data: assessment,
  });
});

/*
|--------------------------------------------------------------------------
| Unpublish Assessment
|--------------------------------------------------------------------------
*/

export const unpublishAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.unpublishAssessment(
    req.params.id,
    req.user,
  );

  return res.json({
    success: true,
    message: "Assessment unpublished successfully.",
    data: assessment,
  });
});

/*
|--------------------------------------------------------------------------
| Delete Assessment
|--------------------------------------------------------------------------
*/

export const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.deleteAssessment(
    req.params.id,
    req.user,
  );

  return res.json({
    success: true,
    message: "Assessment deleted successfully.",
    data: assessment,
  });
});

/*
|--------------------------------------------------------------------------
| Add Questions
|--------------------------------------------------------------------------
*/

export const addQuestionsToAssessment = asyncHandler(async (req, res) => {
  const result = await assessmentService.addQuestionsToAssessment(
    req.params.id,
    req.body.questions,
    req.user,
  );

  return res.json({
    success: true,
    message: "Questions added successfully.",
    data: result,
  });
});

/*
|--------------------------------------------------------------------------
| Remove Questions
|--------------------------------------------------------------------------
*/

export const removeQuestionsFromAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.removeQuestionsFromAssessment(
    req.params.id,
    req.body.questionIds,
    req.user,
  );

  return res.json({
    success: true,
    message: "Questions removed successfully.",
    data: assessment,
  });
});

/*
|--------------------------------------------------------------------------
| Get Assessment
|--------------------------------------------------------------------------
*/

export const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.getAssessment(req.params.id);

  return res.json({
    success: true,
    data: assessment,
  });
});

/*
|--------------------------------------------------------------------------
| Get Assessments
|--------------------------------------------------------------------------
*/

export const getAssessments = asyncHandler(async (req, res) => {
  const assessments = await assessmentService.getAssessments(req.query);

  return res.json({
    success: true,
    data: assessments,
  });
});

/*
|--------------------------------------------------------------------------
| Get Available Assessments
|--------------------------------------------------------------------------
*/

export const getAvailableAssessments = asyncHandler(async (req, res) => {
  const assessments = await assessmentService.getAvailableAssessments(
    req.user,
  );

  return res.json({
    success: true,
    data: assessments,
  });
});
