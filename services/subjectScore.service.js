import SubjectScore from "../models/SubjectScore.js";
import ClassSubject from "../models/ClassSubject.js";
import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import Session from "../models/Session.js";
import Term from "../models/Term.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";
import settingService from "./setting.service.js";

// Maps Assessment.type -> the default score-component key it should
// prefill. "Examination" intentionally maps to "exam" (not a literal
// lowercase of the type) to match the default ClassSubject.scoreComponents
// keys. If a class subject's columns were renamed and no longer include
// this key, applyAttemptScore no-ops rather than guessing.
export const ASSESSMENT_TYPE_TO_COMPONENT_KEY = {
  Assignment: "assignment",
  Quiz: "quiz",
  Test: "test",
  Examination: "exam",
};

// Fallback used only when school settings can't be loaded.
const defaultGradeBands = [
  { min: 70, grade: "A", gradePoint: 5, remark: "Excellent" },
  { min: 60, grade: "B", gradePoint: 4, remark: "Very Good" },
  { min: 50, grade: "C", gradePoint: 3, remark: "Good" },
  { min: 45, grade: "D", gradePoint: 2, remark: "Fair" },
  { min: 40, grade: "E", gradePoint: 1, remark: "Pass" },
  { min: 0, grade: "F", gradePoint: 0, remark: "Fail" },
];

const getGradingConfig = async () => {
  let settings = null;
  try {
    settings = await settingService.getSettings();
  } catch {
    settings = null;
  }

  const bands =
    settings && Array.isArray(settings.gradeBands) && settings.gradeBands.length > 0
      ? settings.gradeBands
      : null;

  return {
    gradeBands: bands
      ? bands
          .map((band) => ({
            grade: band.grade,
            min: Number(band.minScore),
            gradePoint: Number(band.gradePoint ?? 0),
            remark: band.remark ?? "",
          }))
          .sort((a, b) => b.min - a.min)
      : defaultGradeBands,
    passingScore: Number(settings?.passingScore ?? 40),
  };
};

// Recompute total/percentage/grade from active components only. A
// component that's inactive is skipped for totals but its stored score
// value is left untouched (so re-activating doesn't lose data).
const computeTotals = async (scoresMap, scoreComponents) => {
  const activeComponents = (scoreComponents || []).filter((c) => c.isActive);

  let total = 0;
  let totalMaxMarks = 0;

  for (const component of activeComponents) {
    const value = scoresMap.get(component.key);
    if (typeof value === "number" && !Number.isNaN(value)) {
      total += value;
    }
    totalMaxMarks += component.maxMarks;
  }

  const percentage = totalMaxMarks > 0 ? (total / totalMaxMarks) * 100 : 0;

  const { gradeBands, passingScore } = await getGradingConfig();
  const band =
    gradeBands.find((entry) => percentage >= entry.min) ?? gradeBands.at(-1);

  return {
    total: Number(total.toFixed(2)),
    totalMaxMarks,
    percentage: Number(percentage.toFixed(2)),
    grade: band.grade,
    gradePoint: band.gradePoint,
    remark: band.remark,
    passed: percentage >= passingScore,
  };
};

// Authorization: admin can touch anything; a teacher must be assigned to
// teach this specific class+subject (in the active session/term) to
// read/write its scores.
const assertCanAccessClassSubject = async (classSubject, user) => {
  if (user.role === "admin") return;

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: user._id, isActive: true });
    if (!teacher) {
      throw new ApiError(403, "Teacher profile not found.");
    }

    const { session, term } = await getCurrentAcademicContext();

    const assignment = await TeacherAssignment.findOne({
      teacher: teacher._id,
      schoolClass: classSubject.schoolClass,
      subject: classSubject.subject,
      session: session._id,
      term: term._id,
      isActive: true,
    });

    if (!assignment) {
      throw new ApiError(
        403,
        "You are not assigned to teach this subject for this class and cannot manage its scores.",
      );
    }
    return;
  }

  throw new ApiError(403, "You are not authorized to manage scores.");
};

// GET /subject-scores?schoolClass=&subject=&session=&term=
// Builds the mark-entry grid: every actively-enrolled student in the class,
// their existing scores for this subject/term (if any), and the subject's
// score-component config (columns + which are active).
const getMarkEntryGrid = async (query, user) => {
  if (!query.schoolClass || !query.subject) {
    throw new ApiError(400, "Class and subject are required.");
  }

  const classSubject = await ClassSubject.findOne({
    schoolClass: query.schoolClass,
    subject: query.subject,
  })
    .populate("schoolClass")
    .populate("subject");

  if (!classSubject) {
    throw new ApiError(404, "This subject is not assigned to this class.");
  }

  await assertCanAccessClassSubject(classSubject, user);

  let sessionId = query.session;
  let termId = query.term;

  if (!sessionId || !termId) {
    const context = await getCurrentAcademicContext();
    sessionId = sessionId ?? context.session._id;
    termId = termId ?? context.term._id;
  }

  const session = await findDocumentOrFail(Session, sessionId, "Session");
  const term = await findDocumentOrFail(Term, termId, "Term");

  const enrollments = await Enrollment.find({
    schoolClass: classSubject.schoolClass._id,
    session: session._id,
    status: "Active",
  })
    .populate({
      path: "student",
      populate: { path: "user", select: "firstName lastName otherName username" },
    })
    .sort({ rollNumber: 1 });

  const existingScores = await SubjectScore.find({
    classSubject: classSubject._id,
    term: term._id,
    isActive: true,
  });

  const scoresByStudent = new Map(
    existingScores.map((row) => [row.student.toString(), row]),
  );

  const rows = enrollments
    .filter((enrollment) => enrollment.student)
    .map((enrollment) => {
      const existing = scoresByStudent.get(enrollment.student._id.toString());
      const scoresObject = existing ? Object.fromEntries(existing.scores) : {};

      return {
        student: enrollment.student,
        rollNumber: enrollment.rollNumber ?? null,
        subjectScoreId: existing?._id ?? null,
        scores: scoresObject,
        total: existing?.total ?? 0,
        totalMaxMarks: existing?.totalMaxMarks ?? 0,
        percentage: existing?.percentage ?? 0,
        grade: existing?.grade ?? "",
        isPublished: existing?.isPublished ?? false,
      };
    });

  return {
    classSubject,
    session,
    term,
    scoreComponents: classSubject.scoreComponents,
    students: rows,
  };
};

// PUT /subject-scores/bulk
// body: { classSubject, session?, term?, entries: [{ student, scores: { quiz: 8, ... } }] }
// Partial fill allowed — any column omitted for a student is left as-is.
// Per-row failures are collected but don't abort the whole batch, since
// this is an edit-in-place grid and one bad row shouldn't lose the rest of
// the class's work.
const bulkSaveScores = async (data, user) => {
  const classSubject = await findDocumentOrFail(
    ClassSubject,
    data.classSubject,
    "ClassSubject",
  );

  await assertCanAccessClassSubject(classSubject, user);

  const entries = Array.isArray(data.entries) ? data.entries : [];
  if (entries.length === 0) {
    throw new ApiError(400, "No entries to save.");
  }

  let sessionId = data.session;
  let termId = data.term;

  if (!sessionId || !termId) {
    const context = await getCurrentAcademicContext();
    sessionId = sessionId ?? context.session._id;
    termId = termId ?? context.term._id;
  }

  const session = await findDocumentOrFail(Session, sessionId, "Session");
  const term = await findDocumentOrFail(Term, termId, "Term");

  const validKeys = new Set((classSubject.scoreComponents || []).map((c) => c.key));

  const saved = [];
  const failed = [];

  for (const entry of entries) {
    try {
      if (!entry.student) {
        throw new ApiError(400, "Student is required for each entry.");
      }

      const student = await findDocumentOrFail(Student, entry.student, "Student");

      let row = await SubjectScore.findOne({
        student: student._id,
        classSubject: classSubject._id,
        term: term._id,
      });

      if (!row) {
        row = new SubjectScore({
          student: student._id,
          classSubject: classSubject._id,
          session: session._id,
          term: term._id,
          scores: new Map(),
          sourceAttempts: new Map(),
        });
      }

      const incoming = entry.scores || {};
      for (const [key, value] of Object.entries(incoming)) {
        if (!validKeys.has(key)) continue;
        if (value === null || value === undefined || value === "") {
          row.scores.delete(key);
          continue;
        }
        const numeric = Number(value);
        if (Number.isNaN(numeric) || numeric < 0) {
          throw new ApiError(400, `Invalid score for "${key}" (student ${student._id}).`);
        }
        const component = classSubject.scoreComponents.find((c) => c.key === key);
        if (component && numeric > component.maxMarks) {
          throw new ApiError(400, `Score for "${key}" exceeds max marks (${component.maxMarks}).`);
        }
        row.scores.set(key, numeric);
        // Manual entry overwrites any attempt-sourced value for that column.
        row.sourceAttempts.delete(key);
      }

      const totals = await computeTotals(row.scores, classSubject.scoreComponents);
      Object.assign(row, totals);

      await row.save();
      saved.push(row);
    } catch (error) {
      failed.push({
        student: entry.student,
        message: error?.message || "Failed to save this entry.",
      });
    }
  }

  return { saved, failed, savedCount: saved.length, failedCount: failed.length };
};

// Called when a StudentAttempt is graded. Upserts the matching column
// (keyed by Assessment.type, lowercased) on the student's SubjectScore for
// that classSubject/term. Latest graded attempt always overwrites the
// column, per the "latest attempt wins" rule.
const applyAttemptScore = async ({
  student,
  classSubject,
  session,
  term,
  componentKey,
  score,
  assessmentTotalMarks,
  attemptId,
}) => {
  const classSubjectDoc = await ClassSubject.findById(classSubject);
  if (!classSubjectDoc) return null;

  const component = (classSubjectDoc.scoreComponents || []).find(
    (c) => c.key === componentKey,
  );
  if (!component) {
    // Assessment type has no matching column configured for this subject —
    // skip silently rather than failing the grading flow.
    return null;
  }

  // The assessment may be marked out of a different total than the
  // mark-entry column (e.g. a 25-point quiz feeding a "quiz" column capped
  // at 10). Scale proportionally so the column never exceeds its maxMarks.
  const rawScore = Number(score) || 0;
  const sourceTotal = Number(assessmentTotalMarks) || 0;
  const scaledScore =
    sourceTotal > 0
      ? Number(((rawScore / sourceTotal) * component.maxMarks).toFixed(2))
      : Math.min(rawScore, component.maxMarks);

  let row = await SubjectScore.findOne({ student, classSubject, term });

  if (!row) {
    row = new SubjectScore({
      student,
      classSubject,
      session,
      term,
      scores: new Map(),
      sourceAttempts: new Map(),
    });
  }

  row.scores.set(componentKey, scaledScore);
  row.sourceAttempts.set(componentKey, attemptId);

  const totals = await computeTotals(row.scores, classSubjectDoc.scoreComponents);
  Object.assign(row, totals);

  await row.save();
  return row;
};

export default {
  getMarkEntryGrid,
  bulkSaveScores,
  applyAttemptScore,
  computeTotals,
  assertCanAccessClassSubject,
};
