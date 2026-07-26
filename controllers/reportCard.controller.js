import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import reportCardService from "../services/reportCard.service.js";
import reportCardPdfService from "../services/reportCardPdf.service.js";

const listClassReportCards = asyncHandler(async (req, res) => {
  const payload = await reportCardService.listClassReportCards(req.query, req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, "Report cards fetched successfully.", payload));
});

const getStudentReportCard = asyncHandler(async (req, res) => {
  const card = await reportCardService.getStudentReportCard(
    req.params.studentId,
    req.query,
    req.user,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Report card fetched successfully.", card));
});

const publishClassReportCards = asyncHandler(async (req, res) => {
  const batch = await reportCardService.publishClassReportCards(
    req.params.schoolClassId,
    req.body,
    req.user,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Report cards published successfully.", batch));
});

const unpublishClassReportCards = asyncHandler(async (req, res) => {
  const batch = await reportCardService.unpublishClassReportCards(
    req.params.schoolClassId,
    req.body,
    req.user,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Report cards unpublished successfully.", batch));
});

const setStudentReportCardPublishState = asyncHandler(async (req, res) => {
  const result = await reportCardService.setStudentReportCardPublishState(
    req.params.studentId,
    req.body,
    req.user,
  );
  const message = result.isPublished
    ? "Student report card published."
    : "Student report card unpublished.";
  return res.status(200).json(new ApiResponse(200, message, result));
});

const downloadStudentReportCard = asyncHandler(async (req, res) => {
  await reportCardPdfService.streamStudentReportCardPdf(
    req.params.studentId,
    req.query,
    req.user,
    res,
  );
});

// POST /report-cards/bulk-download
// body: { students: [id, ...], session?, term? }
const downloadBulkReportCards = asyncHandler(async (req, res) => {
  await reportCardPdfService.streamBulkReportCardsZip(
    req.body.students,
    req.body,
    req.user,
    res,
  );
});

export default {
  listClassReportCards,
  getStudentReportCard,
  downloadStudentReportCard,
  downloadBulkReportCards,
  publishClassReportCards,
  unpublishClassReportCards,
  setStudentReportCardPublishState,
};
