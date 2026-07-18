import { Router } from "express";

import authRoutes from "./auth.routes.js";
import sessionRoutes from "./session.routes.js";
import termRoutes from "./term.routes.js";
import classRoutes from "./class.routes.js";
import subjectRoutes from "./subject.routes.js";
import teacherRoutes from "./teacher.routes.js";
import studentRoutes from "./student.routes.js";
import enrollmentRoutes from "./enrollment.routes.js";
import teacherAssignmentRoutes from "./teacherAssignment.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TronSchool API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/sessions", sessionRoutes);
router.use("/terms", termRoutes);
router.use("/classes", classRoutes);
router.use("/subjects", subjectRoutes);
router.use("/teachers", teacherRoutes);
router.use("/students", studentRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/teacher-assignments", teacherAssignmentRoutes);

export default router;
