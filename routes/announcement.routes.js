import { Router } from "express";

import announcementController from "../controllers/announcement.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

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
  announcementController.updateAnnouncement,
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  announcementController.deleteAnnouncement,
);

export default router;
