import { Router } from "express";

import lessonController from "../controllers/lesson.controller.js";

import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

import upload from "../middlewares/upload.middleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
  createLessonValidator,
  updateLessonValidator,
} from "../validators/lesson.validator.js";

const router = Router();

router.get("/my", authenticate, lessonController.getMyLessons);

router.get("/", authenticate, authorize("admin"), lessonController.getLessons);

router.get("/:id", authenticate, lessonController.getLessonById);

router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  upload.array("files", 10),
  createLessonValidator,
  validateRequest,
  lessonController.createLesson,
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  upload.array("files", 10),
  updateLessonValidator,
  validateRequest,
  lessonController.updateLesson,
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  lessonController.deleteLesson,
);

export default router;
