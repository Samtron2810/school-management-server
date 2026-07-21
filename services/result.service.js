import Result from "../models/Result.js";
import Assessment from "../models/Assessment.js";
import StudentAttempt from "../models/StudentAttempt.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import ParentStudent from "../models/ParentStudent.js";
import Enrollment from "../models/Enrollment.js";
import Attendance from "../models/Attendance.js";
import ClassSubject from "../models/ClassSubject.js";
import SchoolClass from "../models/SchoolClass.js";
import Subject from "../models/Subject.js";
import Session from "../models/Session.js";
import Term from "../models/Term.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";

const gradeBands = [
  { min: 70, grade: "A", gradePoint: 5, remark: "Excellent" },
  { min: 60, grade: "B", gradePoint: 4, remark: "Very Good" },
  { min: 50, grade: "C", gradePoint: 3, remark: "Good" },
  { min: 45, grade: "D", gradePoint: 2, remark: "Fair" },
  { min: 40, grade: "E", gradePoint: 1, remark: "Pass" },
  { min: 0, grade: "F", gradePoint: 0, remark: "Fail" },
];

const resolveId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value._id) {
    return value._id;
  }

  return value;
};

const getStudentProfile = async (userId) => {
  const student = await Student.findOne({
    user: userId,
    isActive: true,
  });

  if (!student) {
    throw new ApiError(404, "Student profile not found.");
  }

  return student;
};

const getTeacherProfile = async (userId) => {
  const teacher = await Teacher.findOne({
    user: userId,
    isActive: true,
  });

  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found.");
  }

  return teacher;
};

const getParentProfile = async (userId) => {
  const parent = await Parent.findOne({
    user: userId,
    isActive: true,
  });

  if (!parent) {
    throw new ApiError(404, "Parent profile not found.");
  }

  return parent;
};

const computeGrade = (score, totalMarks, percentageInput = null) => {
  const total = Number(totalMarks) || 0;
  const obtained = Number(score) || 0;
  const percentage =
    percentageInput !== null && percentageInput !== undefined
      ? Number(percentageInput) || 0
      : total > 0
        ? (obtained / total) * 100
        : 0;

  const band =
    gradeBands.find((entry) => percentage >= entry.min) ?? gradeBands.at(-1);

  return {
    percentage: Number(percentage.toFixed(2)),
    grade: band.grade,
    gradePoint: band.gradePoint,
    remark: band.remark,
    passed: percentage >= 40,
  };
};

const buildResultPayload = async (data) => {
  let assessment = null;
  let attempt = null;
  let student = null;

  if (data.attempt) {
    attempt = await findDocumentOrFail(
      StudentAttempt,
      resolveId(data.attempt),
      "Student Attempt",
    );

    assessment = await Assessment.findById(attempt.assessment)
      .populate({
        path: "classSubject",
        populate: [
          {
            path: "subject",
          },
          {
            path: "schoolClass",
          },
        ],
      })
      .populate("teacher")
      .populate("session")
      .populate("term");

    if (!assessment) {
      throw new ApiError(404, "Assessment not found.");
    }

    student = await findDocumentOrFail(
      Student,
      resolveId(attempt.student),
      "Student",
    );
  } else {
    if (!data.student) {
      throw new ApiError(400, "Student is required.");
    }

    student = await findDocumentOrFail(Student, data.student, "Student");
  }

  const sessionId = resolveId(data.session ?? assessment?.session ?? null);
  const termId = resolveId(data.term ?? assessment?.term ?? null);

  if (!sessionId || !termId) {
    throw new ApiError(400, "Session and term are required.");
  }

  const session = await findDocumentOrFail(Session, sessionId, "Session");
  const term = await findDocumentOrFail(Term, termId, "Term");

  const totalMarks =
    Number(data.totalMarks) ||
    Number(assessment?.totalMarks) ||
    Number(attempt?.totalQuestions) ||
    0;
  const score =
    Number(data.score) || Number(attempt?.score) || 0;

  const computed = computeGrade(score, totalMarks, data.percentage);

  let classSubject = null;

  if (data.classSubject || assessment?.classSubject) {
    classSubject = await findDocumentOrFail(
      ClassSubject,
      resolveId(data.classSubject ?? assessment.classSubject),
      "Class Subject",
    );
  }

  return {
    student: student._id,
    assessment: data.assessment ?? assessment?._id ?? null,
    attempt: data.attempt ?? attempt?._id ?? null,
    teacher: resolveId(data.teacher ?? assessment?.teacher ?? null),
    teacherAssignment: resolveId(
      data.teacherAssignment ?? assessment?.teacherAssignment ?? null,
    ),
    classSubject: classSubject?._id ?? null,
    session: session._id,
    term: term._id,
    title: data.title ?? assessment?.title ?? "Manual Result",
    type: data.type ?? assessment?.type ?? "Manual",
    score,
    totalMarks,
    percentage: computed.percentage,
    grade: data.grade ?? computed.grade,
    gradePoint: data.gradePoint ?? computed.gradePoint,
    remark: data.remark ?? computed.remark,
    passed: data.passed ?? computed.passed,
    correctAnswers:
      Number(data.correctAnswers) || Number(attempt?.correctAnswers) || 0,
    wrongAnswers:
      Number(data.wrongAnswers) || Number(attempt?.wrongAnswers) || 0,
    skippedQuestions:
      Number(data.skippedQuestions) || Number(attempt?.skippedQuestions) || 0,
    totalQuestions:
      Number(data.totalQuestions) || Number(attempt?.totalQuestions) || 0,
    submittedAt: data.submittedAt ?? attempt?.submittedAt ?? null,
    gradedAt: data.gradedAt ?? attempt?.gradedAt ?? new Date(),
    generatedAt: data.generatedAt ?? new Date(),
    metadata: {
      className: data.metadata?.className ?? "",
      subjectName: data.metadata?.subjectName ?? "",
      assessmentName: data.metadata?.assessmentName ?? "",
    },
    isPublished: data.isPublished ?? true,
  };
};

const createResult = async (data, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to create results.");
  }

  const payload = await buildResultPayload(data);
  const result = await Result.create(payload);

  return result;
};

const updateResult = async (resultId, data, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to update results.");
  }

  const result = await findDocumentOrFail(Result, resultId, "Result");

  const payload = await buildResultPayload({
    ...result.toObject(),
    ...data,
    student: resolveId(data.student ?? result.student),
    assessment: resolveId(data.assessment ?? result.assessment),
    attempt: resolveId(data.attempt ?? result.attempt),
    teacher: resolveId(data.teacher ?? result.teacher),
    teacherAssignment: resolveId(
      data.teacherAssignment ?? result.teacherAssignment,
    ),
    classSubject: resolveId(data.classSubject ?? result.classSubject),
    session: resolveId(data.session ?? result.session),
    term: resolveId(data.term ?? result.term),
  });

  Object.assign(result, payload);

  await result.save();

  return result;
};

const deleteResult = async (resultId, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to delete results.");
  }

  const result = await findDocumentOrFail(Result, resultId, "Result");

  result.isActive = false;

  await result.save();

  return result;
};

const canAccessResult = async (result, user) => {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "student") {
    const student = await getStudentProfile(user._id);

    return result.student.toString() === student._id.toString();
  }

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    return (
      result.teacher &&
      result.teacher.toString() === teacher._id.toString()
    );
  }

  if (user.role === "parent") {
    const parent = await getParentProfile(user._id);

    const relation = await ParentStudent.findOne({
      parent: parent._id,
      student: result.student,
      isActive: true,
    });

    return Boolean(relation);
  }

  return false;
};

const applyAccessFilter = async (results, user) => {
  const visible = [];

  for (const result of results) {
    if (await canAccessResult(result, user)) {
      visible.push(result);
    }
  }

  return visible;
};

const getResults = async (query, user) => {
  const filter = {
    isActive: true,
  };

  if (query.student) {
    filter.student = query.student;
  }

  if (query.assessment) {
    filter.assessment = query.assessment;
  }

  if (query.session) {
    filter.session = query.session;
  }

  if (query.term) {
    filter.term = query.term;
  }

  if (query.classSubject) {
    filter.classSubject = query.classSubject;
  }

  const results = await Result.find(filter)
    .populate({
      path: "student",
      populate: {
        path: "user",
        select: "firstName lastName otherName username avatar",
      },
    })
    .populate("assessment")
    .populate("attempt")
    .populate({
      path: "teacher",
      populate: {
        path: "user",
        select: "firstName lastName otherName username",
      },
    })
    .populate("teacherAssignment")
    .populate({
      path: "classSubject",
      populate: [
        {
          path: "subject",
        },
        {
          path: "schoolClass",
        },
      ],
    })
    .populate("session")
    .populate("term")
    .sort({
      generatedAt: -1,
      createdAt: -1,
    });

  return await applyAccessFilter(results, user);
};

const getResultById = async (resultId, user) => {
  const result = await findDocumentOrFail(Result, resultId, "Result");

  const allowed = await canAccessResult(result, user);

  if (!allowed) {
    throw new ApiError(403, "You are not allowed to view this result.");
  }

  return await Result.findById(resultId)
    .populate({
      path: "student",
      populate: {
        path: "user",
        select: "firstName lastName otherName username avatar",
      },
    })
    .populate("assessment")
    .populate("attempt")
    .populate({
      path: "teacher",
      populate: {
        path: "user",
        select: "firstName lastName otherName username",
      },
    })
    .populate("teacherAssignment")
    .populate({
      path: "classSubject",
      populate: [
        {
          path: "subject",
        },
        {
          path: "schoolClass",
        },
      ],
    })
    .populate("session")
    .populate("term");
};

const generateReportCard = async (studentId, query, user) => {
  const student = await findDocumentOrFail(Student, studentId, "Student");

  if (user.role === "student") {
    const currentStudent = await getStudentProfile(user._id);

    if (currentStudent._id.toString() !== student._id.toString()) {
      throw new ApiError(403, "You are not allowed to view this report card.");
    }
  }

  if (user.role === "parent") {
    const parent = await getParentProfile(user._id);

    const relation = await ParentStudent.findOne({
      parent: parent._id,
      student: student._id,
      isActive: true,
    });

    if (!relation) {
      throw new ApiError(403, "You are not allowed to view this report card.");
    }
  }

  let sessionId = query.session;
  let termId = query.term;

  if (!sessionId || !termId) {
    const context = await getCurrentAcademicContext();
    sessionId = sessionId ?? context.session._id;
    termId = termId ?? context.term._id;
  }

  const session = await findDocumentOrFail(Session, sessionId, "Session");
  const term = await findDocumentOrFail(Term, termId, "Term");

  const enrollment = await Enrollment.findOne({
    student: student._id,
    session: session._id,
    term: term._id,
    status: "Active",
  }).populate("schoolClass");

  const results = await Result.find({
    student: student._id,
    session: session._id,
    term: term._id,
    isActive: true,
  })
    .populate({
      path: "classSubject",
      populate: [
        {
          path: "subject",
        },
        {
          path: "schoolClass",
        },
      ],
    })
    .populate("assessment")
    .sort({
      createdAt: 1,
    });

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
    if (record.status === "Present") {
      present++;
    } else if (record.status === "Absent") {
      absent++;
    } else if (record.status === "Late") {
      late++;
    } else if (record.status === "Excused") {
      excused++;
    }
  }

  const totalAttendance = attendance.length;
  const attendancePercentage =
    totalAttendance === 0
      ? 0
      : Number((((present + late) / totalAttendance) * 100).toFixed(2));

  const totalScore = results.reduce((sum, item) => sum + (item.score || 0), 0);
  const totalMarks = results.reduce(
    (sum, item) => sum + (item.totalMarks || 0),
    0,
  );
  const averagePercentage =
    totalMarks === 0 ? 0 : Number(((totalScore / totalMarks) * 100).toFixed(2));

  const gradeDistribution = results.reduce(
    (accumulator, item) => {
      const grade = item.grade || "F";
      accumulator[grade] = (accumulator[grade] || 0) + 1;
      return accumulator;
    },
    {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
    },
  );

  return {
    student,
    enrollment,
    session,
    term,
    summary: {
      subjectCount: results.length,
      totalScore,
      totalMarks,
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
    results,
  };
};

const createFromAttempt = async (attemptId, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to generate results.");
  }

  const attempt = await findDocumentOrFail(
    StudentAttempt,
    attemptId,
    "Student Attempt",
  );

  const existing = await Result.findOne({
    attempt: attempt._id,
    isActive: true,
  });

  const payload = await buildResultPayload({
    attempt: attempt._id,
  });

  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }

  return await Result.create(payload);
};

export default {
  computeGrade,
  createResult,
  updateResult,
  deleteResult,
  getResults,
  getResultById,
  generateReportCard,
  createFromAttempt,
};
