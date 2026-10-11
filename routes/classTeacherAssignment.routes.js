import { Router } from "express";
import classTeacherAssignmentController from "../controllers/classTeacherAssignment.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import {
  createClassTeacherAssignmentValidator,
  updateClassTeacherAssignmentValidator,
} from "../validators/classTeacherAssignment.validator.js";

const router = Router();

router.use(protect, authorize("admin"));

router.post(
  "/",
  createClassTeacherAssignmentValidator,
  validate,
  classTeacherAssignmentController.assignClassTeacher,
);

router.get("/", classTeacherAssignmentController.getClassTeacherAssignments);

router.patch(
  "/:id",
  updateClassTeacherAssignmentValidator,
  validate,
  classTeacherAssignmentController.updateClassTeacherAssignment,
);

router.delete("/:id", classTeacherAssignmentController.deleteClassTeacherAssignment);

export default router;
