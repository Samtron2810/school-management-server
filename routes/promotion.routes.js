import { Router } from "express";

import promotionController from "../controllers/promotion.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", protect, authorize("admin"), promotionController.getPromotions);
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
