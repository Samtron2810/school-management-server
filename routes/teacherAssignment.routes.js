import { Router } from "express";
import teacherAssignmentController from "../controllers/teacherAssignment.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";
import {
  createTeacherAssignmentValidator,
  updateTeacherAssignmentValidator,
} from "../validators/teacherAssignment.validator.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  createTeacherAssignmentValidator,
  validate,
  teacherAssignmentController.createTeacherAssignment,
);

router.get(
  "/",
  protect,
  authorize("admin"),
  teacherAssignmentController.getTeacherAssignments,
);

// Teacher-scoped: the signed-in teacher's own assignments (before /:id).
router.get(
  "/my",
  protect,
  authorize("teacher"),
  teacherAssignmentController.getMyTeacherAssignments,
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  teacherAssignmentController.getTeacherAssignment,
);

// Class roster for one assignment (admin or the assigned teacher).
router.get(
  "/:id/students",
  protect,
  authorize("admin", "teacher"),
  teacherAssignmentController.getAssignmentStudents,
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateTeacherAssignmentValidator,
  validate,
  teacherAssignmentController.updateTeacherAssignment,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  teacherAssignmentController.deleteTeacherAssignment,
);

export default router;
