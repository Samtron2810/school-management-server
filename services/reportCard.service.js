import SubjectScore from "../models/SubjectScore.js";
import ReportCardBatch from "../models/ReportCardBatch.js";
import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import Parent from "../models/Parent.js";
import ParentStudent from "../models/ParentStudent.js";
import SchoolClass from "../models/SchoolClass.js";
import Session from "../models/Session.js";
import Term from "../models/Term.js";
import Attendance from "../models/Attendance.js";
import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";

const getStudentProfile = async (userId) => {
  const student = await Student.findOne({ user: userId, isActive: true });
  if (!student) throw new ApiError(404, "Student profile not found.");
  return student;
};

const getParentProfile = async (userId) => {
  const parent = await Parent.findOne({ user: userId, isActive: true });
  if (!parent) throw new ApiError(404, "Parent profile not found.");
  return parent;
};

const resolveSessionTerm = async (query) => {
  let sessionId = query.session;
  let termId = query.term;

  if (!sessionId || !termId) {
    const context = await getCurrentAcademicContext();
    sessionId = sessionId ?? context.session._id;
    termId = termId ?? context.term._id;
  }

  const session = await findDocumentOrFail(Session, sessionId, "Session");
  const term = await findDocumentOrFail(Term, termId, "Term");

  return { session, term };
};

// GET /report-cards?schoolClass=&session=&term=
// Admin/teacher: lists every actively-enrolled student in the class who has
// at least one SubjectScore row (complete or incomplete) for the term —
// works whether or not the class report card batch has been published.
const listClassReportCards = async (query, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to view report cards.");
  }

  if (!query.schoolClass) {
    throw new ApiError(400, "Class is required.");
  }

  const schoolClass = await findDocumentOrFail(
    SchoolClass,
    query.schoolClass,
    "Class",
  );

  const { session, term } = await resolveSessionTerm(query);

  const enrollments = await Enrollment.find({
    schoolClass: schoolClass._id,
    session: session._id,
    status: "Active",
  })
    .populate({
      path: "student",
      populate: { path: "user", select: "firstName lastName otherName username" },
    })
    .sort({ rollNumber: 1 });

  const studentIds = enrollments.map((e) => e.student?._id).filter(Boolean);

  // A student "has data" for this class/term if any SubjectScore row for
  // any of the class's subjects exists — join via classSubject.schoolClass.
  const scores = await SubjectScore.find({
    student: { $in: studentIds },
    term: term._id,
    isActive: true,
  }).populate({ path: "classSubject", match: { schoolClass: schoolClass._id } });

  const scoresByStudent = new Map();
  for (const row of scores) {
    if (!row.classSubject) continue; // populate match excluded other classes
    const key = row.student.toString();
    if (!scoresByStudent.has(key)) scoresByStudent.set(key, []);
    scoresByStudent.get(key).push(row);
  }

  const batch = await ReportCardBatch.findOne({
    schoolClass: schoolClass._id,
    session: session._id,
    term: term._id,
  });

  const students = enrollments
    .filter((enrollment) => enrollment.student)
    .map((enrollment) => {
      const studentRows = scoresByStudent.get(enrollment.student._id.toString()) || [];
      if (studentRows.length === 0) return null;

      const subjectCount = studentRows.length;
      const completeCount = studentRows.filter(
        (row) => row.totalMaxMarks > 0 && row.total !== null,
      ).length;

      return {
        student: enrollment.student,
        rollNumber: enrollment.rollNumber ?? null,
        subjectCount,
        isComplete: completeCount === subjectCount,
        isPublished: studentRows.every((row) => row.isPublished),
        anyPublished: studentRows.some((row) => row.isPublished),
      };
    })
    .filter(Boolean);

  return {
    schoolClass,
    session,
    term,
    batch: batch
      ? { isPublished: batch.isPublished, publishedAt: batch.publishedAt }
      : { isPublished: false, publishedAt: null },
    students,
  };
};

// Shared builder for a single student's report card payload (used by
// admin/teacher detail view, student self-view, and parent view).
const buildStudentReportCard = async (student, session, term) => {
  const enrollment = await Enrollment.findOne({
    student: student._id,
    session: session._id,
    term: term._id,
    status: "Active",
  }).populate("schoolClass");

  const scores = await SubjectScore.find({
    student: student._id,
    term: term._id,
    isActive: true,
  })
    .populate({
      path: "classSubject",
      populate: [{ path: "subject" }, { path: "schoolClass" }],
    })
    .sort({ createdAt: 1 });

  const attendance = await Attendance.find({
    student: student._id,
    session: session._id,
    term: term._id,
    isActive: true,
  }).select("status");

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  for (const record of attendance) {
    if (record.status === "Present") present++;
    else if (record.status === "Absent") absent++;
    else if (record.status === "Late") late++;
    else if (record.status === "Excused") excused++;
  }
  const totalAttendance = attendance.length;
  const attendancePercentage =
    totalAttendance === 0
      ? 0
      : Number((((present + late) / totalAttendance) * 100).toFixed(2));

  const totalScore = scores.reduce((sum, row) => sum + (row.total || 0), 0);
  const totalMaxMarks = scores.reduce((sum, row) => sum + (row.totalMaxMarks || 0), 0);
  const averagePercentage =
    totalMaxMarks === 0 ? 0 : Number(((totalScore / totalMaxMarks) * 100).toFixed(2));

  const gradeDistribution = scores.reduce(
    (acc, row) => {
      const grade = row.grade || "F";
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    },
    { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
  );

  return {
    student,
    enrollment,
    session,
    term,
    summary: {
      subjectCount: scores.length,
      totalScore,
      totalMaxMarks,
      averagePercentage,
      gradeDistribution,
      attendance: {
        total: totalAttendance,
        present,
        absent,
        late,
        excused,
        attendancePercentage,
      },
    },
    subjects: scores,
    isPublished: scores.length > 0 && scores.every((row) => row.isPublished),
  };
};

// GET /report-cards/:studentId — admin/teacher (any time) or the
// student/parent themselves (only once published).
const getStudentReportCard = async (studentId, query, user) => {
  const student = await findDocumentOrFail(Student, studentId, "Student", {
    populate: {
      path: "user",
      select: "firstName lastName otherName username",
    },
  });

  const { session, term } = await resolveSessionTerm(query);

  const isStaff = ["admin", "teacher"].includes(user.role);

  if (user.role === "student") {
    const currentStudent = await getStudentProfile(user._id);
    if (currentStudent._id.toString() !== student._id.toString()) {
      throw new ApiError(403, "You are not allowed to view this report card.");
    }
  } else if (user.role === "parent") {
    const parent = await getParentProfile(user._id);
    const relation = await ParentStudent.findOne({
      parent: parent._id,
      student: student._id,
      isActive: true,
    });
    if (!relation) {
      throw new ApiError(403, "You are not allowed to view this report card.");
    }
  } else if (!isStaff) {
    throw new ApiError(403, "You are not allowed to view this report card.");
  }

  const card = await buildStudentReportCard(student, session, term);

  if (!isStaff && !card.isPublished) {
    throw new ApiError(404, "This report card has not been published yet.");
  }

  return card;
};

// POST /report-cards/:schoolClass/publish — publishes every SubjectScore
// row for every actively-enrolled student in the class, for this term.
// Batch-level; individual students can be unpublished afterward.
const publishClassReportCards = async (schoolClassId, body, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to publish report cards.");
  }

  const schoolClass = await findDocumentOrFail(SchoolClass, schoolClassId, "Class");
  const { session, term } = await resolveSessionTerm(body);

  const enrollments = await Enrollment.find({
    schoolClass: schoolClass._id,
    session: session._id,
    status: "Active",
  }).select("student");

  const studentIds = enrollments.map((e) => e.student);

  const classSubjectRowIds = await SubjectScore.find({
    student: { $in: studentIds },
    term: term._id,
    isActive: true,
  })
    .populate({ path: "classSubject", match: { schoolClass: schoolClass._id } })
    .then((rows) => rows.filter((row) => row.classSubject).map((row) => row._id));

  await SubjectScore.updateMany(
    { _id: { $in: classSubjectRowIds } },
    { isPublished: true },
  );

  const batch = await ReportCardBatch.findOneAndUpdate(
    { schoolClass: schoolClass._id, session: session._id, term: term._id },
    {
      isPublished: true,
      publishedAt: new Date(),
      publishedBy: user._id,
      unpublishedAt: null,
      unpublishedBy: null,
    },
    { upsert: true, new: true },
  );

  return batch;
};

// POST /report-cards/:schoolClass/unpublish — class-level withdrawal.
const unpublishClassReportCards = async (schoolClassId, body, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to unpublish report cards.");
  }

  const schoolClass = await findDocumentOrFail(SchoolClass, schoolClassId, "Class");
  const { session, term } = await resolveSessionTerm(body);

  const batch = await ReportCardBatch.findOneAndUpdate(
    { schoolClass: schoolClass._id, session: session._id, term: term._id },
    {
      isPublished: false,
      unpublishedAt: new Date(),
      unpublishedBy: user._id,
    },
    { upsert: true, new: true },
  );

  return batch;
};

// PATCH /report-cards/:studentId/publish — per-student override.
// body: { isPublished: boolean, session?, term? }
const setStudentReportCardPublishState = async (studentId, body, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to publish report cards.");
  }

  const student = await findDocumentOrFail(Student, studentId, "Student");
  const { term } = await resolveSessionTerm(body);

  if (typeof body.isPublished !== "boolean") {
    throw new ApiError(400, "isPublished (boolean) is required.");
  }

  await SubjectScore.updateMany(
    { student: student._id, term: term._id, isActive: true },
    { isPublished: body.isPublished },
  );

  return { student: student._id, term: term._id, isPublished: body.isPublished };
};

export default {
  listClassReportCards,
  getStudentReportCard,
  buildStudentReportCard,
  publishClassReportCards,
  unpublishClassReportCards,
  setStudentReportCardPublishState,
};
