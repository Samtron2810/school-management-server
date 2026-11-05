import SubjectScore from "../models/SubjectScore.js";
import ReportCardBatch from "../models/ReportCardBatch.js";
import ClassSubject from "../models/ClassSubject.js";
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
import { getClassRoster, ROSTER_STATUSES } from "../utils/classRoster.js";
import notificationService from "./notification.service.js";
import settingService from "./setting.service.js";

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

  if (String(term.session) !== String(session._id)) {
    throw new ApiError(400, "The selected term does not belong to the selected session.");
  }

  return { session, term };
};

const hasScoreValue = (row, key) => {
  const value = row.scores?.get ? row.scores.get(key) : row.scores?.[key];
  return typeof value === "number" && !Number.isNaN(value);
};

const classLabel = (schoolClass) =>
  schoolClass.fullName ||
  [schoolClass.className, schoolClass.arm].filter(Boolean).join(" ");

// { studentId -> { Present: n, Absent: n, ... } } in a single aggregation.
const getAttendanceCounts = async (studentIds, sessionId, termId) => {
  const rows = await Attendance.aggregate([
    {
      $match: {
        student: { $in: studentIds },
        session: sessionId,
        term: termId,
        isActive: true,
      },
    },
    {
      $group: {
        _id: { student: "$student", status: "$status" },
        count: { $sum: 1 },
      },
    },
  ]);

  const byStudent = new Map();
  for (const { _id, count } of rows) {
    const key = String(_id.student);
    if (!byStudent.has(key)) byStudent.set(key, {});
    byStudent.get(key)[_id.status] = count;
  }
  return byStudent;
};

// GET /report-cards?schoolClass=&session=&term=
// Admin/teacher: lists every enrolled student in the class who has at least
// one SubjectScore row for the term — works whether or not the class report
// card batch has been published.
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

  const [enrollments, classSubjectIds, expectedSubjects, settings, batch] =
    await Promise.all([
      getClassRoster(schoolClass._id, session._id, {
        populate: {
          path: "student",
          populate: {
            path: "user",
            select: "firstName lastName otherName username",
          },
        },
      }),
      ClassSubject.distinct("_id", { schoolClass: schoolClass._id }),
      ClassSubject.countDocuments({
        schoolClass: schoolClass._id,
        isActive: true,
      }),
      settingService.getSettings(),
      ReportCardBatch.findOne({
        schoolClass: schoolClass._id,
        session: session._id,
        term: term._id,
      }),
    ]);

  const activeKeys = (settings.scoreComponents || [])
    .filter((component) => component.isActive)
    .map((component) => component.key);

  const studentIds = enrollments.map((e) => e.student?._id).filter(Boolean);

  const scores = await SubjectScore.find({
    student: { $in: studentIds },
    term: term._id,
    classSubject: { $in: classSubjectIds },
    isActive: true,
  });

  const scoresByStudent = new Map();
  for (const row of scores) {
    const key = row.student.toString();
    if (!scoresByStudent.has(key)) scoresByStudent.set(key, []);
    scoresByStudent.get(key).push(row);
  }

  const students = enrollments
    .filter((enrollment) => enrollment.student)
    .map((enrollment) => {
      const studentRows =
        scoresByStudent.get(enrollment.student._id.toString()) || [];
      if (studentRows.length === 0) return null;

      // Complete = every active score column filled for every subject the
      // class offers. (Totals default to 0, so "total !== null" can never
      // tell a half-filled row from a finished one.)
      const isComplete =
        studentRows.length >= expectedSubjects &&
        studentRows.every((row) =>
          activeKeys.every((key) => hasScoreValue(row, key)),
        );

      return {
        student: enrollment.student,
        rollNumber: enrollment.rollNumber ?? null,
        subjectCount: studentRows.length,
        expectedSubjects,
        isComplete,
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

// Pure assembly of a report card payload from already-loaded data. Shared by
// the single-student view and the class-wide loader so both always agree.
const assembleCard = ({
  student,
  enrollment,
  session,
  term,
  scores,
  counts = {},
}) => {
  const present = counts.Present || 0;
  const absent = counts.Absent || 0;
  const late = counts.Late || 0;
  const excused = counts.Excused || 0;
  const totalAttendance = Object.values(counts).reduce((a, b) => a + b, 0);
  const attendancePercentage =
    totalAttendance === 0
      ? 0
      : Number((((present + late) / totalAttendance) * 100).toFixed(2));

  const totalScore = scores.reduce((sum, row) => sum + (row.total || 0), 0);
  const totalMaxMarks = scores.reduce(
    (sum, row) => sum + (row.totalMaxMarks || 0),
    0,
  );
  const averagePercentage =
    totalMaxMarks === 0
      ? 0
      : Number(((totalScore / totalMaxMarks) * 100).toFixed(2));

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

// The student's enrollment for this session. Prefers the row for the exact
// term, but falls back to any term in the session (a student is often
// enrolled once, in the first term) so the class never prints as "—".
const findStudentEnrollment = async (studentId, sessionId, termId) => {
  const rows = await Enrollment.find({
    student: studentId,
    session: sessionId,
    status: { $in: ROSTER_STATUSES },
  }).populate("schoolClass");

  return (
    rows.find((row) => String(row.term) === String(termId)) || rows[0] || null
  );
};

// Shared builder for a single student's report card payload (used by
// admin/teacher detail view, student self-view, and parent view).
const buildStudentReportCard = async (student, session, term) => {
  const [enrollment, scores, counts] = await Promise.all([
    findStudentEnrollment(student._id, session._id, term._id),
    SubjectScore.find({
      student: student._id,
      term: term._id,
      isActive: true,
    })
      .populate({
        path: "classSubject",
        populate: [{ path: "subject" }, { path: "schoolClass" }],
      })
      .sort({ createdAt: 1 }),
    getAttendanceCounts([student._id], session._id, term._id),
  ]);

  return assembleCard({
    student,
    enrollment,
    session,
    term,
    scores,
    counts: counts.get(String(student._id)),
  });
};

// Builds report cards for a whole class in a fixed number of queries
// (roster, scores, attendance) instead of ~8 queries per student. Used by
// bulk PDF generation. `studentIds` optionally narrows it to some students.
const loadClassReportCards = async (
  schoolClass,
  session,
  term,
  studentIds = null,
) => {
  const roster = (
    await getClassRoster(schoolClass._id, session._id, {
      populate: {
        path: "student",
        populate: {
          path: "user",
          select: "firstName lastName otherName username",
        },
      },
    })
  ).filter((enrollment) => enrollment.student);

  let rows = roster;
  if (Array.isArray(studentIds) && studentIds.length > 0) {
    const wanted = new Set(studentIds.map(String));
    rows = roster.filter((e) => wanted.has(String(e.student._id)));
  }

  if (rows.length === 0) return [];

  const ids = rows.map((e) => e.student._id);
  const classSubjectIds = await ClassSubject.distinct("_id", {
    schoolClass: schoolClass._id,
  });

  const [scoreRows, counts] = await Promise.all([
    SubjectScore.find({
      student: { $in: ids },
      term: term._id,
      classSubject: { $in: classSubjectIds },
      isActive: true,
    })
      .populate({ path: "classSubject", populate: { path: "subject" } })
      .sort({ createdAt: 1 }),
    getAttendanceCounts(ids, session._id, term._id),
  ]);

  const scoresByStudent = new Map();
  for (const row of scoreRows) {
    const key = String(row.student);
    if (!scoresByStudent.has(key)) scoresByStudent.set(key, []);
    scoresByStudent.get(key).push(row);
  }

  return rows.map((enrollment) => {
    const key = String(enrollment.student._id);
    return assembleCard({
      student: enrollment.student,
      enrollment: {
        _id: enrollment._id,
        rollNumber: enrollment.rollNumber,
        status: enrollment.status,
        schoolClass,
      },
      session,
      term,
      scores: scoresByStudent.get(key) || [],
      counts: counts.get(key),
    });
  });
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

// Class-wide notification, batched: 3 reads + 2 inserts for the whole class
// (the old per-student loop ran several queries per student before the
// publish request could respond). Never throws — notifications must not
// break publishing.
const notifyClassPublished = async (studentIds, schoolClass, term) => {
  try {
    const students = await Student.find({ _id: { $in: studentIds } }).select(
      "user",
    );
    const links = await ParentStudent.find({
      student: { $in: studentIds },
      isActive: true,
    }).select("parent");
    const parents = links.length
      ? await Parent.find({
          _id: { $in: links.map((link) => link.parent) },
        }).select("user")
      : [];

    const label = `${classLabel(schoolClass)} (${term.name})`;

    await notificationService.notifyUsers(
      students.map((s) => s.user),
      {
        title: "Report Card Published",
        message: `Your report card for ${label} has been published.`,
        type: "grade",
        link: `/student/report-cards`,
      },
    );
    await notificationService.notifyUsers(
      parents.map((p) => p.user),
      {
        title: "Child's Report Card Published",
        message: `Your child's report card for ${label} has been published.`,
        type: "grade",
        link: `/parent/child-report-cards`,
      },
    );
  } catch (error) {
    console.error(
      "Failed to send report card notifications:",
      error?.message || error,
    );
  }
};

// The SubjectScore filter for "every score row of this class in this term".
const classScoreFilter = async (schoolClass, session, term) => {
  const [roster, classSubjectIds] = await Promise.all([
    getClassRoster(schoolClass._id, session._id),
    ClassSubject.distinct("_id", { schoolClass: schoolClass._id }),
  ]);

  const studentIds = roster.map((e) => e.student);

  return {
    studentIds,
    filter: {
      student: { $in: studentIds },
      term: term._id,
      classSubject: { $in: classSubjectIds },
      isActive: true,
    },
  };
};

// POST /report-cards/:schoolClass/publish — publishes every SubjectScore
// row for every enrolled student in the class, for this term.
// Batch-level; individual students can be unpublished afterward.
const publishClassReportCards = async (schoolClassId, body, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to publish report cards.");
  }

  const schoolClass = await findDocumentOrFail(
    SchoolClass,
    schoolClassId,
    "Class",
  );
  const { session, term } = await resolveSessionTerm(body);

  const { studentIds, filter } = await classScoreFilter(
    schoolClass,
    session,
    term,
  );

  await SubjectScore.updateMany(filter, { isPublished: true });

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

  // Fire and forget: students/parents get notified without making the
  // publisher wait for it.
  notifyClassPublished(studentIds, schoolClass, term);

  return batch;
};

// POST /report-cards/:schoolClass/unpublish — class-level withdrawal.
// Students and parents see a report card based on the SubjectScore rows'
// isPublished flag, so those rows MUST be flipped too — updating only the
// batch record would leave every card still visible.
const unpublishClassReportCards = async (schoolClassId, body, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(
      403,
      "You are not authorized to unpublish report cards.",
    );
  }

  const schoolClass = await findDocumentOrFail(
    SchoolClass,
    schoolClassId,
    "Class",
  );
  const { session, term } = await resolveSessionTerm(body);

  const { filter } = await classScoreFilter(schoolClass, session, term);

  await SubjectScore.updateMany(filter, { isPublished: false });

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

  // Notify the student and their parents.
  try {
    const action = body.isPublished ? "published" : "unpublished";
    const Action = action.charAt(0).toUpperCase() + action.slice(1);

    if (student.user) {
      await notificationService.notifyUsers([student.user], {
        title: `Report Card ${Action}`,
        message: `Your report card has been ${action}.`,
        type: "grade",
        link: `/student/report-cards`,
      });
    }

    const relations = await ParentStudent.find({
      student: student._id,
      isActive: true,
    }).select("parent");
    const parentIds = relations.map((r) => r.parent);
    if (parentIds.length > 0) {
      const parents = await Parent.find({ _id: { $in: parentIds } }).select(
        "user",
      );
      const parentUserIds = parents.map((p) => p.user).filter(Boolean);
      if (parentUserIds.length > 0) {
        await notificationService.notifyUsers(parentUserIds, {
          title: `Child's Report Card ${Action}`,
          message: `The report card for your child has been ${action}.`,
          type: "grade",
          link: `/parent/child-report-cards`,
        });
      }
    }
  } catch (error) {
    console.error(
      "Failed to send report card notification:",
      error?.message || error,
    );
  }

  return {
    student: student._id,
    term: term._id,
    isPublished: body.isPublished,
  };
};

export default {
  resolveSessionTerm,
  listClassReportCards,
  getStudentReportCard,
  buildStudentReportCard,
  loadClassReportCards,
  publishClassReportCards,
  unpublishClassReportCards,
  setStudentReportCardPublishState,
};
