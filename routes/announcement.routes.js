import { Router } from "express";

import announcementController from "../controllers/announcement.controller.js";
import Announcement from "../models/Announcement.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import checkOwnership from "../middlewares/checkOwnership.middleware.js";

const router = Router();

router.get("/", protect, announcementController.getAnnouncements);
router.get("/:id", protect, announcementController.getAnnouncementById);
router.post(
  "/",
  protect,
  authorize("admin", "teacher"),
  announcementController.createAnnouncement,
);
router.patch(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  checkOwnership(Announcement, "createdBy"),
  announcementController.updateAnnouncement,
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  checkOwnership(Announcement, "createdBy"),
  announcementController.deleteAnnouncement,
);

export default router;
