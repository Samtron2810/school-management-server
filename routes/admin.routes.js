import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { runRetention } from "../services/retention.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { logAdminAction } from "../config/logger.js";

const router = Router();

// POST /api/v1/admin/retention/run
// Manually trigger the data retention sweep. Admin-only.
router.post(
  "/retention/run",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const result = await runRetention();

    logAdminAction("manual_retention_run", {
      adminId: req.user._id,
      detail: result,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Data retention completed.", result));
  }),
);

export default router;
