import { Router } from "express";

import promotionController from "../controllers/promotion.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", protect, authorize("admin"), promotionController.getPromotions);
// Before "/:id" so "roster" isn't read as a promotion id.
router.get(
  "/roster",
  protect,
  authorize("admin"),
  promotionController.getPromotionRoster,
);
router.get(
  "/:id",
  protect,
  authorize("admin"),
  promotionController.getPromotionById,
);
router.post(
  "/",
  protect,
  authorize("admin"),
  promotionController.promoteStudents,
);

export default router;
