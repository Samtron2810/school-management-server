import { Router } from "express";

import lessonController from "../controllers/lesson.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

import upload from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validation.middleware.js";

import {
  createLessonValidator,
  updateLessonValidator,
} from "../validators/lesson.validator.js";

const router = Router();

router.get("/my", protect, lessonController.getMyLessons);

router.get("/", protect, authorize("admin"), lessonController.getLessons);

router.get("/:id", protect, lessonController.getLessonById);

router.post(
  "/",
  protect,
  authorize("admin", "teacher"),
  upload.array("files", 10),
  createLessonValidator,
  validate,
  lessonController.createLesson,
);

router.patch(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  upload.array("files", 10),
  updateLessonValidator,
  validate,
  lessonController.updateLesson,
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  lessonController.deleteLesson,
);

export default router;
