import { Router } from "express";

import notificationController from "../controllers/notification.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/my", protect, notificationController.getMyNotifications);

router.patch("/read-all", protect, notificationController.markAllAsRead);

router.patch("/:id/read", protect, notificationController.markAsRead);

router.delete("/:id", protect, notificationController.deleteNotification);

export default router;
