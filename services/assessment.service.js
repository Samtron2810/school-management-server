import Assessment from "../models/Assessment.js";
import AssessmentQuestion from "../models/AssessmentQuestion.js";
import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import StudentAttempt from "../models/StudentAttempt.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import ClassSubject from "../models/ClassSubject.js";
import Question from "../models/Question.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";

import { getCurrentAcademicContext } from "../utils/academicContext.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

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

const getAssignment = async (teacherId, assignmentId, role) => {
  const assignment = await findDocumentOrFail(
    TeacherAssignment,
    assignmentId,
    "Teacher Assignment",
  );

  if (!assignment.isActive) {
    throw new ApiError(400, "Teacher assignment is inactive.");
  }

  if (
    role === "teacher" &&
    assignment.teacher.toString() !== teacherId.toString()
  ) {
    throw new ApiError(403, "You are not assigned to this class.");
  }

  return assignment;
};

const getClassSubject = async (assignment) => {
  const classSubject = await ClassSubject.findOne({
    schoolClass: assignment.schoolClass,

    subject: assignment.subject,

    isActive: true,
  });

  if (!classSubject) {
    throw new ApiError(404, "Class subject not found.");
  }

  return classSubject;
};

const refreshAssessmentStatistics = async (assessmentId, session = null) => {
  const assessmentQuestions = await AssessmentQuestion.find({
    assessment: assessmentId,
  }).session(session);

  let totalMarks = 0;
  let requiredQuestions = 0;
  let bonusQuestions = 0;

  for (const item of assessmentQuestions) {
    totalMarks += item.marks;

    if (item.isBonus) {
      bonusQuestions++;
    } else {
      requiredQuestions++;
    }
  }

  await Assessment.updateOne(
    { _id: assessmentId },
    {
      totalQuestions: assessmentQuestions.length,
      totalMarks,
      requiredQuestions,
      bonusQuestions,
    },
    { session },
  );
};

/*
|--------------------------------------------------------------------------
| Create Assessment
|--------------------------------------------------------------------------
*/

const createAssessment = async (data, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized.");
  }

  let teacher;

  if (user.role === "teacher") {
    teacher = await getTeacherProfile(user._id);
  }

  const assignment = await getAssignment(
    teacher ? teacher._id : null,
    data.teacherAssignment,
    user.role,
  );

  const classSubject = await getClassSubject(assignment);

  if (!teacher) {
    teacher = await findDocumentOrFail(Teacher, assignment.teacher, "Teacher");
  }

  const { session, term } = await getCurrentAcademicContext();

  const assessment = await Assessment.create({
    teacherAssignment: assignment._id,

    classSubject: classSubject._id,

    teacher: teacher._id,

    session: session._id,

    term: term._id,

    title: data.title,

    instructions: data.instructions,

    type: data.type,

    duration: data.duration,

    passingScore: data.passingScore,

    maxAttempts: data.maxAttempts,

    shuffleQuestions: data.shuffleQuestions,

    shuffleOptions: data.shuffleOptions,

    showScoreImmediately: data.showScoreImmediately,

    showCorrectAnswers: data.showCorrectAnswers,

    availableFrom: data.availableFrom,

    availableTo: data.availableTo,
  });

  return assessment;
};

/*
|--------------------------------------------------------------------------
| Update Assessment
|--------------------------------------------------------------------------
*/

const updateAssessment = async (assessmentId, data, user) => {
  const assessment = await findDocumentOrFail(
    Assessment,
    assessmentId,
    "Assessment",
  );

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    if (assessment.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, "You cannot edit this assessment.");
    }
  }

  Object.assign(assessment, {
    title: data.title ?? assessment.title,

    instructions: data.instructions ?? assessment.instructions,

    type: data.type ?? assessment.type,

    duration: data.duration ?? assessment.duration,

    passingScore: data.passingScore ?? assessment.passingScore,

    maxAttempts: data.maxAttempts ?? assessment.maxAttempts,

    shuffleQuestions: data.shuffleQuestions ?? assessment.shuffleQuestions,

    shuffleOptions: data.shuffleOptions ?? assessment.shuffleOptions,

    showScoreImmediately:
      data.showScoreImmediately ?? assessment.showScoreImmediately,

    showCorrectAnswers:
      data.showCorrectAnswers ?? assessment.showCorrectAnswers,

    availableFrom: data.availableFrom ?? assessment.availableFrom,

    availableTo: data.availableTo ?? assessment.availableTo,
  });

  await assessment.save();

  return assessment;
};

/*
|--------------------------------------------------------------------------
| Publish Assessment
|--------------------------------------------------------------------------
*/

const publishAssessment = async (assessmentId, user) => {
  const assessment = await findDocumentOrFail(
    Assessment,
    assessmentId,
    "Assessment",
  );

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    if (assessment.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, "You cannot publish this assessment.");
    }
  }

  const totalQuestions = await AssessmentQuestion.countDocuments({
    assessment: assessment._id,
  });

  if (totalQuestions === 0) {
    throw new ApiError(
      400,
      "An assessment must contain at least one question before publishing.",
    );
  }

  assessment.isPublished = true;
  assessment.publishedAt = new Date();

  await assessment.save();

  return assessment;
};

/*
|--------------------------------------------------------------------------
| Unpublish Assessment
|--------------------------------------------------------------------------
*/

const unpublishAssessment = async (assessmentId, user) => {
  const assessment = await findDocumentOrFail(
    Assessment,
    assessmentId,
    "Assessment",
  );

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    if (assessment.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, "You cannot unpublish this assessment.");
    }
  }

  assessment.isPublished = false;
  assessment.publishedAt = null;

  await assessment.save();

  return assessment;
};

/*
|--------------------------------------------------------------------------
| Delete Assessment
|--------------------------------------------------------------------------
*/

const deleteAssessment = async (assessmentId, user) => {
  const assessment = await findDocumentOrFail(
    Assessment,
    assessmentId,
    "Assessment",
  );

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    if (assessment.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, "You cannot delete this assessment.");
    }
  }

  assessment.isActive = false;

  await assessment.save();

  return assessment;
};

/*
|--------------------------------------------------------------------------
| Add Questions To Assessment
|--------------------------------------------------------------------------
*/

const addQuestionsToAssessment = async (assessmentId, questions, user) => {
  const assessment = await findDocumentOrFail(
    Assessment,
    assessmentId,
    "Assessment",
  );

  if (assessment.isPublished) {
    throw new ApiError(400, "Published assessments cannot be modified.");
  }

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    if (assessment.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, "You cannot modify this assessment.");
    }
  }

  const operations = [];

  const seenQuestions = new Set();

  let totalMarks = 0;

  for (const item of questions) {
    if (seenQuestions.has(item.question)) {
      throw new ApiError(400, "Duplicate question detected.");
    }

    seenQuestions.add(item.question);

    const question = await findDocumentOrFail(
      Question,
      item.question,
      "Question",
    );
    if (!question.isActive) {
      throw new ApiError(400, "Question is inactive.");
    }

    if (
      question.classSubject.toString() !== assessment.classSubject.toString()
    ) {
      throw new ApiError(400, "Question belongs to a different class subject.");
    }

    operations.push({
      insertOne: {
        document: {
          assessment: assessment._id,

          question: question._id,

          order: item.order,

          marks: item.marks ?? question.marks,

          isBonus: item.isBonus ?? false,

          isRequired: item.isRequired ?? true,
        },
      },
    });

    totalMarks += item.marks ?? question.marks;
  }

  if (operations.length > 0) {
    await AssessmentQuestion.bulkWrite(operations);
  }

  const assessmentQuestions = await AssessmentQuestion.find({
    assessment: assessment._id,
  }).select("marks");

  assessment.totalMarks = assessmentQuestions.reduce(
    (total, question) => total + question.marks,
    0,
  );

  await assessment.save();

  await refreshAssessmentStatistics(assessment._id);

  return {
    assessment,
    totalQuestions: operations.length,
  };
};

/*
|--------------------------------------------------------------------------
| Remove Questions From Assessment
|--------------------------------------------------------------------------
*/

const removeQuestionsFromAssessment = async (
  assessmentId,
  questionIds,
  user,
) => {
  const assessment = await findDocumentOrFail(
    Assessment,
    assessmentId,
    "Assessment",
  );

  if (assessment.isPublished) {
    throw new ApiError(400, "Published assessments cannot be modified.");
  }

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    if (assessment.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, "You cannot modify this assessment.");
    }
  }

  await AssessmentQuestion.deleteMany({
    assessment: assessment._id,
    question: {
      $in: questionIds,
    },
  });

  const assessmentQuestions = await AssessmentQuestion.find({
    assessment: assessment._id,
  }).select("marks");

  assessment.totalMarks = assessmentQuestions.reduce(
    (total, question) => total + question.marks,
    0,
  );

  await assessment.save();

  await refreshAssessmentStatistics(assessment._id);

  return assessment;
};

/*
|--------------------------------------------------------------------------
| Get Assessment
|--------------------------------------------------------------------------
*/

const getAssessment = async (assessmentId) => {
  return await Assessment.findById(assessmentId)
    .populate("teacher")
    .populate("teacherAssignment")
    .populate({
      path: "classSubject",
      populate: [{ path: "subject" }, { path: "schoolClass" }],
    })
    .populate("session")
    .populate("term");
};

/*
|--------------------------------------------------------------------------
| Get Assessments
|--------------------------------------------------------------------------
*/

const getAssessments = async (filter = {}) => {
  return await Assessment.find({
    ...filter,
    isActive: true,
  })
    .populate("teacher")
    .populate("teacherAssignment")
    .populate({
      path: "classSubject",
      populate: [{ path: "subject" }, { path: "schoolClass" }],
    })
    .populate("session")
    .populate("term")
    .sort({
      createdAt: -1,
    });
};

/*
|--------------------------------------------------------------------------
| Get Available Assessments For Student
|--------------------------------------------------------------------------
*/

const getAvailableAssessments = async (user) => {
  if (user.role !== "student") {
    throw new ApiError(403, "Only students can access available assessments.");
  }

  const student = await getStudentProfile(user._id);
  const { session, term } = await getCurrentAcademicContext();
  const now = new Date();

  const enrollment = await Enrollment.findOne({
    student: student._id,
    session: session._id,
    term: term._id,
    status: "Active",
  }).populate("schoolClass");

  if (!enrollment) {
    return [];
  }

  const classSubjects = await ClassSubject.find({
    schoolClass: enrollment.schoolClass._id,
    isActive: true,
  }).select("_id");

  if (classSubjects.length === 0) {
    return [];
  }

  const assessments = await Assessment.find({
    classSubject: {
      $in: classSubjects.map((classSubject) => classSubject._id),
    },
    session: session._id,
    term: term._id,
    isActive: true,
    isPublished: true,
    availableTo: {
      $gte: now,
    },
  })
    .populate("teacher")
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
      availableFrom: -1,
      createdAt: -1,
    });

  if (assessments.length === 0) {
    return [];
  }

  const attempts = await StudentAttempt.find({
    assessment: {
      $in: assessments.map((assessment) => assessment._id),
    },
    student: student._id,
    isActive: true,
  })
    .select(
      "assessment status attemptNumber score percentage submittedAt expiresAt startedAt createdAt",
    )
    .sort({
      attemptNumber: -1,
      createdAt: -1,
    });

  const attemptsByAssessment = new Map();

  for (const attempt of attempts) {
    const key = attempt.assessment.toString();
    const current = attemptsByAssessment.get(key) ?? [];
    current.push(attempt);
    attemptsByAssessment.set(key, current);
  }

  return assessments.map((assessment) => {
    const assessmentAttempts =
      attemptsByAssessment.get(assessment._id.toString()) ?? [];
    const latestAttempt = assessmentAttempts[0] ?? null;
    const submittedAttempts = assessmentAttempts.filter((attempt) =>
      ["Submitted", "Auto Submitted"].includes(attempt.status),
    ).length;
    const isUpcoming = now < assessment.availableFrom;

    return {
      ...assessment.toObject(),
      availabilityStatus: isUpcoming ? "Upcoming" : "Available",
      attemptSummary: {
        totalAttempts: assessmentAttempts.length,
        submittedAttempts,
        remainingAttempts: Math.max(
          0,
          assessment.maxAttempts - submittedAttempts,
        ),
        hasInProgressAttempt:
          assessmentAttempts.some((attempt) => attempt.status === "In Progress"),
        canStart:
          !isUpcoming &&
          submittedAttempts < assessment.maxAttempts &&
          !assessmentAttempts.some((attempt) => attempt.status === "In Progress"),
        latestAttempt,
      },
    };
  });
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export default {
  createAssessment,
  updateAssessment,
  publishAssessment,
  unpublishAssessment,
  deleteAssessment,
  addQuestionsToAssessment,
  removeQuestionsFromAssessment,
  getAssessment,
  getAssessments,
  getAvailableAssessments,
};
