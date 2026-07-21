import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import promotionService from "../services/promotion.service.js";

const promoteStudents = asyncHandler(async (req, res) => {
  const promotion = await promotionService.promoteStudents(req.body, req.user);

  return res
    .status(201)
    .json(new ApiResponse(201, "Students promoted successfully.", promotion));
});

const getPromotions = asyncHandler(async (req, res) => {
  const promotions = await promotionService.getPromotions();

  return res
    .status(200)
    .json(new ApiResponse(200, "Promotions fetched successfully.", promotions));
});

const getPromotionById = asyncHandler(async (req, res) => {
  const promotion = await promotionService.getPromotionById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Promotion fetched successfully.", promotion));
});

export default {
  promoteStudents,
  getPromotions,
  getPromotionById,
};
