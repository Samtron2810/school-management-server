import Question from "../models/Question.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import ClassSubject from "../models/ClassSubject.js";
import Assessment from "../models/Assessment.js";
import AssessmentQuestion from "../models/AssessmentQuestion.js";

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

const getTeacherAssignment = async (assignmentId, user) => {
  const assignment = await findDocumentOrFail(
    TeacherAssignment,
    assignmentId,
    "Teacher Assignment",
  );

  if (!assignment.isActive) {
    throw new ApiError(400, "Teacher assignment is inactive.");
  }

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    if (assignment.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, "You are not assigned to this class.");
    }

    return {
      teacher,
      assignment,
    };
  }

  const teacher = await findDocumentOrFail(
    Teacher,
    assignment.teacher,
    "Teacher",
  );

  return {
    teacher,
    assignment,
  };
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

/*
|--------------------------------------------------------------------------
| Create Question
|--------------------------------------------------------------------------
*/

const createQuestion = async (data, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized.");
  }

  const { teacher, assignment } = await getTeacherAssignment(
    data.teacherAssignment,
    user,
  );

  const classSubject = await getClassSubject(assignment);

  const { session, term } = await getCurrentAcademicContext();

  return await Question.create({
    teacher: teacher._id,

    classSubject: classSubject._id,

    session: session._id,

    term: term._id,

    question: data.question,

    options: data.options,

    correctAnswer: data.correctAnswer,

    explanation: data.explanation,

    marks: data.marks,

    difficulty: data.difficulty,

    isPublished: data.isPublished ?? true,
  });
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getQuestion = async (questionId) => {
  const question = await findDocumentOrFail(Question, questionId, "Question");

  if (!question.isActive) {
    throw new ApiError(400, "Question is inactive.");
  }

  return question;
};

const ensureQuestionOwner = async (question, user) => {
  if (user.role === "admin") {
    return;
  }

  const teacher = await getTeacherProfile(user._id);

  if (question.teacher.toString() !== teacher._id.toString()) {
    throw new ApiError(403, "Unauthorized.");
  }
};

const ensureQuestionEditable = async (questionId) => {
  const assessmentQuestions = await AssessmentQuestion.find({
    question: questionId,
  }).select("assessment");

  if (assessmentQuestions.length === 0) {
    return;
  }

  const assessmentIds = assessmentQuestions.map(
    (assessmentQuestion) => assessmentQuestion.assessment,
  );

  const publishedAssessment = await Assessment.findOne({
    _id: {
      $in: assessmentIds,
    },
    isPublished: true,
    isActive: true,
  }).select("_id");

  if (publishedAssessment) {
    throw new ApiError(
      400,
      "Question belongs to a published assessment and cannot be modified.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| Update Question
|--------------------------------------------------------------------------
*/

const updateQuestion = async (questionId, data, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized.");
  }

  const question = await getQuestion(questionId);

  await ensureQuestionOwner(question, user);

  await ensureQuestionEditable(question._id);

  Object.assign(question, {
    question: data.question ?? question.question,

    options: data.options ?? question.options,

    correctAnswer: data.correctAnswer ?? question.correctAnswer,

    explanation: data.explanation ?? question.explanation,

    marks: data.marks ?? question.marks,

    difficulty: data.difficulty ?? question.difficulty,
  });

  await question.save();

  return question;
};

/*
|--------------------------------------------------------------------------
| Delete Question
|--------------------------------------------------------------------------
*/

const deleteQuestion = async (questionId, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized.");
  }

  const question = await getQuestion(questionId);

  await ensureQuestionOwner(question, user);

  await ensureQuestionEditable(question._id);

  question.isActive = false;

  await question.save();

  return question;
};

/*
|--------------------------------------------------------------------------
| Duplicate Question
|--------------------------------------------------------------------------
*/

const duplicateQuestion = async (questionId, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized.");
  }

  const question = await getQuestion(questionId);

  await ensureQuestionOwner(question, user);

  const duplicate = await Question.create({
    teacher: question.teacher,

    classSubject: question.classSubject,

    session: question.session,

    term: question.term,

    question: `${question.question} (Copy)`,

    options: question.options.map((option) => ({
      ...option,
    })),

    correctAnswer: question.correctAnswer,

    explanation: question.explanation,

    marks: question.marks,

    difficulty: question.difficulty,
  });

  return duplicate;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/*
|--------------------------------------------------------------------------
| Get Question
|--------------------------------------------------------------------------
*/

const getQuestionById = async (questionId) => {
  return await Question.findById(questionId)
    .populate("teacher")
    .populate("classSubject")
    .populate("session")
    .populate("term");
};

/*
|--------------------------------------------------------------------------
| Get Questions
|--------------------------------------------------------------------------
*/

const getQuestions = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search,
    teacher,
    classSubject,
    difficulty,
    session,
    term,
    isActive = true,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const query = {
    isActive,
  };

  if (teacher) {
    query.teacher = teacher;
  }

  if (classSubject) {
    query.classSubject = classSubject;
  }

  if (difficulty) {
    query.difficulty = difficulty;
  }

  if (session) {
    query.session = session;
  }

  if (term) {
    query.term = term;
  }

  if (search) {
    query.question = {
      $regex: escapeRegex(search),
      $options: "i",
    };
  }

  const allowedSorts = new Set([
    "createdAt",
    "updatedAt",
    "marks",
    "difficulty",
  ]);

  const sortField = allowedSorts.has(sortBy) ? sortBy : "createdAt";

  const sort = {
    [sortField]: sortOrder === "asc" ? 1 : -1,
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate("teacher")
      .populate("classSubject")
      .populate("session")
      .populate("term")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Question.countDocuments(query),
  ]);

  return {
    data: questions,

    pagination: {
      page: Number(page),

      limit: Number(limit),

      total,

      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

/*
|--------------------------------------------------------------------------
| Delete Questions
|--------------------------------------------------------------------------
*/

const deleteQuestions = async (questionIds, user) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized.");
  }

  const questions = await Question.find({
    _id: {
      $in: questionIds,
    },
    isActive: true,
  });

  if (questions.length !== questionIds.length) {
    throw new ApiError(404, "One or more questions were not found.");
  }

  const questionMap = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );

  if (user.role === "teacher") {
    const teacher = await getTeacherProfile(user._id);

    for (const question of questions) {
      if (question.teacher.toString() !== teacher._id.toString()) {
        throw new ApiError(
          403,
          "You do not own one or more selected questions.",
        );
      }
    }
  }

  const linkedAssessmentQuestions = await AssessmentQuestion.find({
    question: {
      $in: questionIds,
    },
  }).select("assessment");

  if (linkedAssessmentQuestions.length) {
    const assessmentIds = [
      ...new Set(
        linkedAssessmentQuestions.map((item) => item.assessment.toString()),
      ),
    ];

    const publishedAssessment = await Assessment.findOne({
      _id: {
        $in: assessmentIds,
      },
      isPublished: true,
      isActive: true,
    }).select("_id");

    if (publishedAssessment) {
      throw new ApiError(
        400,
        "One or more questions belong to a published assessment.",
      );
    }
  }

  await Question.updateMany(
    {
      _id: {
        $in: questionIds,
      },
    },
    {
      $set: {
        isActive: false,
      },
    },
  );

  return {
    success: true,
    affectedCount: questionIds.length,
  };
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export default {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  getQuestion,
  getQuestions,
  deleteQuestions,
};
