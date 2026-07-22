import { Router } from "express";

import announcementController from "../controllers/announcement.controller.js";
import Announcement from "../models/Announcement.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import checkOwnership from "../middlewares/checkOwnership.middleware.js";

const router = Router();

router.get("/", authenticate, announcementController.getAnnouncements);
router.get("/:id", authenticate, announcementController.getAnnouncementById);
router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  announcementController.createAnnouncement,
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  checkOwnership(Announcement, "createdBy"),
  announcementController.updateAnnouncement,
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  checkOwnership(Announcement, "createdBy"),
  announcementController.deleteAnnouncement,
);

export default router;
