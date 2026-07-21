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
import parentRoutes from "./parent.routes.js";
import parentStudentRoutes from "./parentStudent.routes.js";
import userRoutes from "./user.routes.js";
import classSubjectRoutes from "./classSubject.routes.js";
import lessonRoutes from "./lesson.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import assessmentRoutes from "./assessment.routes.js";
import questionRoutes from "./question.routes.js";
import studentAttemptRoutes from "./studentAttempt.routes.js";
import studentAnswerRoutes from "./studentAnswer.routes.js";
import resultRoutes from "./result.routes.js";
import announcementRoutes from "./announcement.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import promotionRoutes from "./promotion.routes.js";

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
router.use("/parents", parentRoutes);
router.use("/parent-students", parentStudentRoutes);
router.use("/users", userRoutes);
router.use("/class-subjects", classSubjectRoutes);
router.use("/lessons", lessonRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/assessments", assessmentRoutes);
router.use("/questions", questionRoutes);
router.use("/student-attempts", studentAttemptRoutes);
router.use("/student-answers", studentAnswerRoutes);
router.use("/results", resultRoutes);
router.use("/announcements", announcementRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/promotions", promotionRoutes);

export default router;
