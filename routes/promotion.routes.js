import { Router } from "express";

import promotionController from "../controllers/promotion.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

const router = Router();

router.get("/", authenticate, authorize("admin"), promotionController.getPromotions);
router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  promotionController.getPromotionById,
);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  promotionController.promoteStudents,
);

export default router;
