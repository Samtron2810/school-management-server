import { Router } from "express";

import settingController from "../controllers/setting.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import { updateSettingsValidator } from "../validators/setting.validator.js";

const router = Router();

// Any signed-in user can read settings (school name/logo on report cards),
// only admins can change them.
router.get("/", protect, settingController.getSettings);

router.patch(
  "/",
  protect,
  authorize("admin"),
  updateSettingsValidator,
  validate,
  settingController.updateSettings,
);

export default router;
