import { Router } from "express";
import { csrfProtection } from "../config/csrf.js";

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
import subjectScoreRoutes from "./subjectScore.routes.js";
import reportCardRoutes from "./reportCard.routes.js";
import settingRoutes from "./setting.routes.js";
import announcementRoutes from "./announcement.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import promotionRoutes from "./promotion.routes.js";
import timetableRoutes from "./timetable.routes.js";
import notificationRoutes from "./notification.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TronSchool API is running",
  });
});

// Public auth endpoints that must work without a session/CSRF cookie.
// Login is here because the client has no token yet; forgot/reset-password
// because the user may be fully logged out; resend-verification requires
// the user to be signed in (protect runs first) but its CSRF token comes
// from a prior login response — keep it out of this list so the global
// check still applies to it.
const CSRF_EXEMPT_PATHS = new Set([
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

// Apply CSRF protection globally on all mutating requests (POST, PUT, PATCH,
// DELETE) except the paths above that have no session to bind a token to.
router.use((req, res, next) => {
  const method = req.method.toLowerCase();
  if (["get", "head", "options"].includes(method)) {
    return next();
  }
  if (CSRF_EXEMPT_PATHS.has(req.path)) {
    return next();
  }
  csrfProtection(req, res, next);
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
router.use("/subject-scores", subjectScoreRoutes);
router.use("/report-cards", reportCardRoutes);
router.use("/settings", settingRoutes);
router.use("/announcements", announcementRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/promotions", promotionRoutes);
router.use("/timetables", timetableRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

export default router;
