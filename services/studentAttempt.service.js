import mongoose from "mongoose";
import Assessment from "../models/Assessment.js";
import AssessmentQuestion from "../models/AssessmentQuestion.js";
import StudentAttempt from "../models/StudentAttempt.js";
import StudentAttemptQuestion from "../models/StudentAttemptQuestion.js";
import Student from "../models/Student.js";
import StudentAnswer from "../models/StudentAnswer.js";
import Question from "../models/Question.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import Teacher from "../models/Teacher.js";

import { getCurrentAcademicContext } from "../utils/academicContext.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

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

const ensureAssessmentAvailable = async (assessment) => {
  if (!assessment.isActive) {
    throw new ApiError(400, "Assessment is inactive.");
  }

  if (!assessment.isPublished) {
    throw new ApiError(400, "Assessment has not been published.");
  }

  const now = new Date();

  if (now < assessment.availableFrom) {
    throw new ApiError(400, "Assessment is not yet available.");
  }

  if (now > assessment.availableTo) {
    throw new ApiError(400, "Assessment has already closed.");
  }
};

const shuffle = (array) => {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

const shuffleArray = (array) => {
  return shuffle(array);
};

const getAttemptStudentId = (attempt) => {
  return attempt.student?._id ?? attempt.student;
};

const generateOptionOrder = (optionCount) => {
  return shuffle(
    Array.from(
      {
        length: optionCount,
      },
      (_, index) => index,
    ),
  );
};

const calculateExpiry = (durationMinutes) => {
  return new Date(Date.now() + durationMinutes * 60 * 1000);
};

const validateAssessment = async (assessmentId, student, session) => {
  const assessment = await Assessment.findById(assessmentId).session(session);

  if (!assessment) {
    throw new ApiError(404, "Assessment not found.");
  }

  await ensureAssessmentAvailable(assessment);

  return assessment;
};

const validateAttemptLimit = async (assessment, student, session) => {
  const attemptCount = await StudentAttempt.countDocuments({
    assessment: assessment._id,
    student: student._id,
    isActive: true,
    status: { $in: ["Submitted", "Auto Submitted"] },
  }).session(session);

  if (attemptCount >= assessment.maxAttempts) {
    throw new ApiError(400, "Maximum number of attempts reached.");
  }

  return attemptCount;
};

/*
|--------------------------------------------------------------------------
| Start Assessment
|--------------------------------------------------------------------------
*/

const startAssessment = async (data, user) => {
  if (user.role !== "student") {
    throw new ApiError(403, "Only students can start assessments.");
  }

  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const student = await getStudentProfile(user._id);

    const assessment = await validateAssessment(
      data.assessment,
      student,
      session,
    );

    await validateAttemptLimit(assessment, student, session);

    const attempt = await createAttempt(assessment, student, session);

    const attemptQuestions = await buildAttemptQuestions(assessment, attempt);

    await createAttemptQuestions(attemptQuestions, session);

    await session.commitTransaction();

    return attempt;
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    session.endSession();
  }
};

// create attempt
const createAttempt = async (assessment, student, session) => {
  const previousAttempts = await StudentAttempt.countDocuments({
    assessment: assessment._id,
    student: student._id,
    isActive: true,
  }).session(session);

  const attempt = await StudentAttempt.create(
    [
      {
        assessment: assessment._id,

        student: student._id,

        attemptNumber: previousAttempts + 1,

        expiresAt: calculateExpiry(assessment.duration),

        totalQuestions: assessment.totalQuestions,
      },
    ],
    {
      session,
    },
  );

  return attempt[0];
};

// build attempt
const buildAttemptQuestions = async (assessment, attempt) => {
  let assessmentQuestions = await AssessmentQuestion.find({
    assessment: assessment._id,
  })
    .populate("question")
    .lean();

  if (assessment.shuffleQuestions) {
    assessmentQuestions = shuffle(assessmentQuestions);
  }

  return assessmentQuestions.map((assessmentQuestion, index) => ({
    attempt: attempt._id,

    assessmentQuestion: assessmentQuestion._id,

    displayOrder: index + 1,

    optionOrder: assessment.shuffleOptions
      ? generateOptionOrder(assessmentQuestion.question.options.length)
      : Array.from(
          {
            length: assessmentQuestion.question.options.length,
          },
          (_, i) => i,
        ),
  }));
};

//create attempt
const createAttemptQuestions = async (questions, session) => {
  await StudentAttemptQuestion.insertMany(questions, {
    session,
  });
};

/*
|--------------------------------------------------------------------------
| Calculate Score
|--------------------------------------------------------------------------
*/

const calculateScore = async (attempt) => {
  const attemptQuestions = await StudentAttemptQuestion.find({
    attempt: attempt._id,
    isActive: true,
  });

  const assessmentQuestionIds = attemptQuestions.map(
    (aq) => aq.assessmentQuestion,
  );

  const answers = await StudentAnswer.find({
    studentAttemptQuestion: { $in: attemptQuestions.map((aq) => aq._id) },
    isActive: true,
  });

  const assessmentQuestions = await AssessmentQuestion.find({
    _id: { $in: assessmentQuestionIds },
  }).populate("question");

  const questionMap = new Map();
  assessmentQuestions.forEach((aq) => {
    questionMap.set(aq._id.toString(), aq);
  });

  let answeredQuestions = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let skippedQuestions = 0;
  let score = 0;
  let totalPossibleMarks = 0;

  for (const answer of answers) {
    if (answer.selectedAnswer === null || answer.selectedAnswer === undefined) {
      skippedQuestions++;
      continue;
    }

    answeredQuestions++;

    if (answer.isCorrect) {
      correctAnswers++;
      score += answer.marksAwarded;
    } else {
      wrongAnswers++;
    }
  }

  // Calculate total possible marks from all assessment questions
  for (const aq of assessmentQuestions) {
    totalPossibleMarks += aq.marks;
  }

  skippedQuestions = attempt.totalQuestions - answeredQuestions;

  const percentage =
    totalPossibleMarks === 0 ? 0 : (score / totalPossibleMarks) * 100;

  return {
    answeredQuestions,
    correctAnswers,
    wrongAnswers,
    skippedQuestions,
    score,
    percentage,
  };
};

/*
|--------------------------------------------------------------------------
| Finalize Attempt
|--------------------------------------------------------------------------
*/

const finalizeAttempt = async (attempt, status) => {
  const assessment = await Assessment.findById(attempt.assessment);

  const result = await calculateScore(attempt);
  const passed = result.percentage >= assessment.passingScore;

  attempt.answeredQuestions = result.answeredQuestions;
  attempt.correctAnswers = result.correctAnswers;
  attempt.wrongAnswers = result.wrongAnswers;
  attempt.skippedQuestions = result.skippedQuestions;
  attempt.score = result.score;
  attempt.percentage = result.percentage;
  attempt.passed = passed;
  attempt.status = status;
  attempt.submittedAt = new Date();
  attempt.gradedAt = new Date();
  attempt.gradingVersion = 1;

  await attempt.save();

  return attempt;
};

/*
|--------------------------------------------------------------------------
| Get Attempt
|--------------------------------------------------------------------------
*/

const getAttempt = async (attemptId) => {
  const attempt =
    await StudentAttempt.findById(attemptId).populate("assessment");

  if (!attempt) {
    throw new ApiError(404, "Student Attempt not found.");
  }

  return attempt;
};

/*
|--------------------------------------------------------------------------
| Ensure Student Owns Attempt
|--------------------------------------------------------------------------
*/

const ensureStudentOwnsAttempt = (attempt, student) => {
  if (getAttemptStudentId(attempt).toString() !== student._id.toString()) {
    throw new ApiError(403, "Unauthorized.");
  }

  return attempt;
};

/*
|--------------------------------------------------------------------------
| Submit Assessment
|--------------------------------------------------------------------------
*/

const submitAssessment = async (attemptId, user) => {
  if (user.role !== "student") {
    throw new ApiError(403, "Only students can submit assessments.");
  }

  const student = await getStudentProfile(user._id);

  const attempt = await getAttempt(attemptId);

  ensureStudentOwnsAttempt(attempt, student);

  if (attempt.status !== "In Progress") {
    throw new ApiError(400, "Assessment has already been submitted.");
  }

  return await finalizeAttempt(attempt, "Submitted");
};

/*
|--------------------------------------------------------------------------
| Auto Submit Assessment
|--------------------------------------------------------------------------
*/

const autoSubmitAssessment = async (attemptId) => {
  const attempt = await getAttempt(attemptId);

  if (attempt.status !== "In Progress") {
    return attempt;
  }

  if (new Date() < attempt.expiresAt) {
    return attempt;
  }

  return await finalizeAttempt(attempt, "Auto Submitted");
};

/*
|--------------------------------------------------------------------------
| Get Student Attempt
|--------------------------------------------------------------------------
*/

const getStudentAttempt = async (attemptId, user) => {
  const student = await getStudentProfile(user._id);

  return await StudentAttempt.findOne({
    _id: attemptId,
    student: student._id,
  }).populate("assessment");
};

/* 
|--------------------------------------------------------------------------
| Get Student Attempts
|--------------------------------------------------------------------------
*/

// Student → own attempts. Teacher → attempts for their own assessments.
// Admin → everything. All three can filter via ?assessment= & ?status=.
const getStudentAttempts = async (query, user) => {
  const filter = {
    isActive: true,
  };

  if (query.assessment) filter.assessment = query.assessment;
  if (query.status) filter.status = query.status;
  if (query.student && user.role !== "student") filter.student = query.student;

  if (user.role === "student") {
    const student = await getStudentProfile(user._id);
    filter.student = student._id;
  }

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({
      user: user._id,
      isActive: true,
    });

    if (!teacher) {
      throw new ApiError(404, "Teacher profile not found.");
    }

    const assessments = await Assessment.find({
      teacher: teacher._id,
    }).select("_id");

    const assessmentIds = assessments.map((assessment) => assessment._id);

    // A teacher filtering on a specific assessment they don't own gets
    // an empty result rather than other teachers' data.
    if (
      filter.assessment &&
      !assessmentIds.some((id) => id.toString() === filter.assessment.toString())
    ) {
      return [];
    }

    if (!filter.assessment) {
      filter.assessment = { $in: assessmentIds };
    }
  }

  return await StudentAttempt.find(filter)
    .populate("assessment")
    .populate({
      path: "student",
      populate: {
        path: "user",
        select: "firstName lastName otherName username",
      },
    })
    .sort({
      createdAt: -1,
    });
};

/*
|--------------------------------------------------------------------------
| Get Attempt Questions
|--------------------------------------------------------------------------
*/

const getAttemptQuestions = async (attemptId, user) => {
  if (user.role !== "student") {
    throw new ApiError(403, "Only students can access assessment questions.");
  }

  const student = await getStudentProfile(user._id);

  const attempt = await StudentAttempt.findById(attemptId)
    .populate("assessment")
    .populate("student");

  if (!attempt) {
    throw new ApiError(404, "Attempt not found.");
  }

  if (getAttemptStudentId(attempt).toString() !== student._id.toString()) {
    throw new ApiError(403, "Unauthorized.");
  }

  if (attempt.status !== "In Progress") {
    throw new ApiError(400, "Assessment is no longer active.");
  }

  const assessmentQuestions = await AssessmentQuestion.find({
    assessment: attempt.assessment._id,
  })
    .populate("question")
    .sort({
      order: 1,
    });

  const questions = assessmentQuestions.map((item) => ({
    id: item.question._id,

    assessmentQuestion: item._id,

    question: item.question.question,

    options: shuffleArray(item.question.options),

    marks: item.marks,

    order: item.order,

    isRequired: item.isRequired,

    isBonus: item.isBonus,
  }));

  if (attempt.assessment.shuffleQuestions) {
    questions = shuffleArray(questions);
  }

  return questions;
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export default {
  startAssessment,
  submitAssessment,
  autoSubmitAssessment,
  calculateScore,
  getStudentAttempt,
  getStudentAttempts,
  getAttemptQuestions,
  getAttempt,
  ensureStudentOwnsAttempt,
  shuffleArray,
};
