import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import Enrollment from "../models/Enrollment.js";
import Assessment from "../models/Assessment.js";
import StudentAttempt from "../models/StudentAttempt.js";
import Result from "../models/Result.js";
import Announcement from "../models/Announcement.js";
import announcementService from "./announcement.service.js";
import Attendance from "../models/Attendance.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import ClassSubject from "../models/ClassSubject.js";
import SchoolClass from "../models/SchoolClass.js";
import Subject from "../models/Subject.js";

import ApiError from "../utils/ApiError.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";
import ParentStudent from "../models/ParentStudent.js";
import { cacheGet, cacheSet } from "../config/redis.js";

const SUMMARY_TTL = 120;  // 2 min — counts change with every enrollment/student write
const CHART_TTL   = 300;  // 5 min — grade/attendance distributions are slower to shift

const getStudentProfile = async (userId) => {
  const student = await Student.findOne({ user: userId, isActive: true });
  if (!student) throw new ApiError(404, "Student profile not found.");
  return student;
};

const getTeacherProfile = async (userId) => {
  const teacher = await Teacher.findOne({ user: userId, isActive: true });
  if (!teacher) throw new ApiError(404, "Teacher profile not found.");
  return teacher;
};

const getParentProfile = async (userId) => {
  const parent = await Parent.findOne({ user: userId, isActive: true });
  if (!parent) throw new ApiError(404, "Parent profile not found.");
  return parent;
};

const getBaseSummary = async () => {
  const CACHE_KEY = "dashboard:admin:summary";
  const cached = await cacheGet(CACHE_KEY);
  if (cached) return cached;

  const [
    users, students, teachers, parents, enrollments, assessments,
    attempts, results, announcements, attendance, classes, subjects,
    classSubjects, assignments,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Student.countDocuments({ isActive: true }),
    Teacher.countDocuments({ isActive: true }),
    Parent.countDocuments({ isActive: true }),
    Enrollment.countDocuments({}),
    Assessment.countDocuments({ isActive: true }),
    StudentAttempt.countDocuments({ isActive: true }),
    Result.countDocuments({ isActive: true }),
    Announcement.countDocuments({ isActive: true }),
    Attendance.countDocuments({ isActive: true }),
    SchoolClass.countDocuments({ isActive: true }),
    Subject.countDocuments({ isActive: true }),
    ClassSubject.countDocuments({ isActive: true }),
    TeacherAssignment.countDocuments({ isActive: true }),
  ]);

  const summary = {
    users, students, teachers, parents, enrollments, assessments,
    attempts, results, announcements, attendance, classes, subjects,
    classSubjects, assignments,
  };

  await cacheSet(CACHE_KEY, summary, SUMMARY_TTL);
  return summary;
};

const getRecentActivity = async (user) => {
  const [announcements, results, attempts, assessments] = await Promise.all([
    announcementService.getAnnouncements(user).then((list) => list.slice(0, 3)),
    Result.find({ isActive: true })
      .populate({ path: "student", populate: { path: "user", select: "firstName lastName otherName username" } })
      .populate({ path: "classSubject", populate: { path: "subject", select: "name code" } })
      .sort({ createdAt: -1 }).limit(3).lean(),
    StudentAttempt.find({ isActive: true })
      .populate({ path: "student", populate: { path: "user", select: "firstName lastName otherName username" } })
      .populate("assessment")
      .sort({ createdAt: -1 }).limit(3).lean(),
    Assessment.find({ isActive: true }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  return { announcements, results, attempts, assessments };
};

const getChartData = async () => {
  const CACHE_KEY = "dashboard:admin:chart";
  const cached = await cacheGet(CACHE_KEY);
  if (cached) return cached;

  const [results, attendance, announcementStats] = await Promise.all([
    Result.find({ isActive: true }).select("grade percentage createdAt").lean(),
    Attendance.find({ isActive: true }).select("status createdAt").lean(),
    Announcement.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
  ]);

  const gradeDistribution = results.reduce(
    (acc, item) => { const g = item.grade || "F"; acc[g] = (acc[g] || 0) + 1; return acc; },
    { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
  );

  const attendanceDistribution = attendance.reduce(
    (acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; },
    { Present: 0, Absent: 0, Late: 0, Excused: 0 },
  );

  const chart = {
    gradeDistribution,
    attendanceDistribution,
    announcementDistribution: announcementStats.reduce(
      (acc, item) => { acc[item._id] = item.count; return acc; },
      { Low: 0, Normal: 0, High: 0, Urgent: 0 },
    ),
  };

  await cacheSet(CACHE_KEY, chart, CHART_TTL);
  return chart;
};

const getRoleSpecificSummary = async (user) => {
  if (user.role === "admin") return await getBaseSummary();

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);
    const [teacherAssignments, assessments, results, attempts] = await Promise.all([
      TeacherAssignment.countDocuments({ teacher: teacher._id, isActive: true }),
      Assessment.countDocuments({ teacher: teacher._id, isActive: true }),
      Result.countDocuments({ teacher: teacher._id, isActive: true }),
      StudentAttempt.countDocuments({ isActive: true }),
    ]);
    return { teacherAssignments, assessments, results, attempts };
  }

  if (user.role === "student") {
    const student = await getStudentProfile(user._id);
    const { session, term } = await getCurrentAcademicContext();
    const [enrollment, results, attempts] = await Promise.all([
      Enrollment.findOne({
        student: student._id, session: session._id, term: term._id, status: "Active",
      }).populate("schoolClass"),
      Result.countDocuments({ student: student._id, session: session._id, term: term._id, isActive: true }),
      StudentAttempt.countDocuments({ student: student._id, isActive: true }),
    ]);
    return { enrollment, results, attempts };
  }

  if (user.role === "parent") {
    const parent = await getParentProfile(user._id);
    const children = await ParentStudent.countDocuments({ parent: parent._id, isActive: true });
    return { children };
  }

  return {};
};

const getDashboard = async (user) => {
  const [recentActivity, chartData, roleSummary, context] = await Promise.all([
    getRecentActivity(user),
    getChartData(),
    getRoleSpecificSummary(user),
    getCurrentAcademicContext().catch(() => null),
  ]);

  return {
    context,
    summary: user.role === "admin"
      ? { ...(await getBaseSummary()), ...roleSummary }
      : roleSummary,
    recentActivity,
    chartData,
  };
};

export default { getDashboard };
