import StudentAnswer from "../models/StudentAnswer.js";
import StudentAttempt from "../models/StudentAttempt.js";
import StudentAttemptQuestion from "../models/StudentAttemptQuestion.js";
import Student from "../models/Student.js";
import Question from "../models/Question.js";
import AssessmentQuestion from "../models/AssessmentQuestion.js";

import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";

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

const getAttempt = async (attemptId) => {
  const attempt =
    await StudentAttempt.findById(attemptId).populate("assessment");

  if (!attempt) {
    throw new ApiError(404, "Student attempt not found.");
  }

  if (!attempt.isActive) {
    throw new ApiError(400, "Student attempt is inactive.");
  }

  if (attempt.status !== "In Progress") {
    throw new ApiError(400, "Assessment is no longer in progress.");
  }

  if (new Date() > attempt.expiresAt) {
    throw new ApiError(400, "Assessment time has expired.");
  }

  return attempt;
};

const getQuestion = async (questionId) => {
  const question = await findDocumentOrFail(Question, questionId, "Question");

  if (!question.isActive) {
    throw new ApiError(400, "Question is inactive.");
  }

  return question;
};

const gradeAnswer = (selectedAnswer, question, maxMarks) => {
  const isCorrect = selectedAnswer === question.correctAnswer;

  return {
    isCorrect,
    marksAwarded: isCorrect ? maxMarks : 0,
  };
};

/*
|--------------------------------------------------------------------------
| Save Answer
|--------------------------------------------------------------------------
*/

const saveAnswer = async (data, user) => {
  if (user.role !== "student") {
    throw new ApiError(403, "Only students can answer questions.");
  }

  const student = await getStudentProfile(user._id);

  const attempt = await getAttempt(data.attempt);

  if (attempt.student.toString() !== student._id.toString()) {
    throw new ApiError(403, "Unauthorized.");
  }

  const question = await getQuestion(data.question);

  const assessmentQuestion = await AssessmentQuestion.findOne({
    assessment: attempt.assessment._id,
    question: question._id,
  });

  if (!assessmentQuestion) {
    throw new ApiError(400, "Question does not belong to this assessment.");
  }

  // Find the StudentAttemptQuestion record for this attempt and assessment question
  let attemptQuestion = await StudentAttemptQuestion.findOne({
    attempt: attempt._id,
    assessmentQuestion: assessmentQuestion._id,
    isActive: true,
  });

  if (!attemptQuestion) {
    throw new ApiError(400, "Question not found in this attempt.");
  }

  const grading = gradeAnswer(
    data.selectedAnswer,
    question,
    assessmentQuestion.marks,
  );

  // Check if an answer already exists for this attempt question
  let answer = await StudentAnswer.findOne({
    studentAttemptQuestion: attemptQuestion._id,
    isActive: true,
  });

  if (answer) {
    answer.selectedAnswer = data.selectedAnswer;
    answer.isCorrect = grading.isCorrect;
    answer.marksAwarded = grading.marksAwarded;
    answer.answeredAt = new Date();

    await answer.save();

    // Update attempt question status
    attemptQuestion.isAnswered = true;
    attemptQuestion.answeredAt = new Date();
    await attemptQuestion.save();

    return answer;
  }

  answer = await StudentAnswer.create({
    studentAttemptQuestion: attemptQuestion._id,
    selectedAnswer: data.selectedAnswer,
    isCorrect: grading.isCorrect,
    marksAwarded: grading.marksAwarded,
  });

  // Update attempt question status
  attemptQuestion.isAnswered = true;
  attemptQuestion.answeredAt = new Date();
  await attemptQuestion.save();

  return answer;
};

/*
|--------------------------------------------------------------------------
| Clear Answer
|--------------------------------------------------------------------------
*/

const clearAnswer = async (attemptId, questionId, user) => {
  if (user.role !== "student") {
    throw new ApiError(403, "Only students can clear answers.");
  }

  const student = await getStudentProfile(user._id);

  const attempt = await getAttempt(attemptId);

  if (attempt.student.toString() !== student._id.toString()) {
    throw new ApiError(403, "Unauthorized.");
  }

  const assessmentQuestion = await AssessmentQuestion.findOne({
    assessment: attempt.assessment._id,
    question: questionId,
  });

  if (!assessmentQuestion) {
    throw new ApiError(400, "Question does not belong to this assessment.");
  }

  const attemptQuestion = await StudentAttemptQuestion.findOne({
    attempt: attempt._id,
    assessmentQuestion: assessmentQuestion._id,
    isActive: true,
  });

  if (!attemptQuestion) {
    throw new ApiError(404, "Question not found in this attempt.");
  }

  const answer = await StudentAnswer.findOne({
    studentAttemptQuestion: attemptQuestion._id,
    isActive: true,
  });

  if (!answer) {
    throw new ApiError(404, "Answer not found.");
  }

  answer.selectedAnswer = null;
  answer.isCorrect = false;
  answer.marksAwarded = 0;
  answer.answeredAt = new Date();

  await answer.save();

  // Update attempt question status
  attemptQuestion.isAnswered = false;
  attemptQuestion.answeredAt = null;
  await attemptQuestion.save();

  return answer;
};

/*
|--------------------------------------------------------------------------
| Get Answer
|--------------------------------------------------------------------------
*/

const getAnswer = async (attemptId, questionId, user) => {
  if (user.role !== "student") {
    throw new ApiError(403, "Unauthorized.");
  }

  const student = await getStudentProfile(user._id);

  const attempt = await getAttempt(attemptId);

  if (attempt.student.toString() !== student._id.toString()) {
    throw new ApiError(403, "Unauthorized.");
  }

  const assessmentQuestion = await AssessmentQuestion.findOne({
    assessment: attempt.assessment._id,
    question: questionId,
  });

  if (!assessmentQuestion) {
    throw new ApiError(400, "Question does not belong to this assessment.");
  }

  const attemptQuestion = await StudentAttemptQuestion.findOne({
    attempt: attempt._id,
    assessmentQuestion: assessmentQuestion._id,
    isActive: true,
  });

  if (!attemptQuestion) {
    throw new ApiError(404, "Question not found in this attempt.");
  }

  return await StudentAnswer.findOne({
    studentAttemptQuestion: attemptQuestion._id,
    isActive: true,
  });
};

/*
|--------------------------------------------------------------------------
| Get Answers
|--------------------------------------------------------------------------
*/

const getAnswers = async (attemptId, user) => {
  if (user.role !== "student") {
    throw new ApiError(403, "Unauthorized.");
  }

  const student = await getStudentProfile(user._id);

  const attempt = await getAttempt(attemptId);

  if (attempt.student.toString() !== student._id.toString()) {
    throw new ApiError(403, "Unauthorized.");
  }

  const attemptQuestions = await StudentAttemptQuestion.find({
    attempt: attempt._id,
    isActive: true,
  });

  const attemptQuestionIds = attemptQuestions.map((aq) => aq._id);

  return await StudentAnswer.find({
    studentAttemptQuestion: { $in: attemptQuestionIds },
    isActive: true,
  }).sort({
    answeredAt: 1,
  });
};

/*
|--------------------------------------------------------------------------
| Review Answers
|--------------------------------------------------------------------------
*/

const reviewAnswers = async (attemptId, user) => {
  if (user.role !== "student") {
    throw new ApiError(403, "Unauthorized.");
  }

  const student = await getStudentProfile(user._id);

  const attempt =
    await StudentAttempt.findById(attemptId).populate("assessment");

  if (!attempt) {
    throw new ApiError(404, "Student attempt not found.");
  }

  if (attempt.student.toString() !== student._id.toString()) {
    throw new ApiError(403, "Unauthorized.");
  }

  if (attempt.status === "In Progress") {
    throw new ApiError(400, "Assessment has not been submitted.");
  }

  const attemptQuestions = await StudentAttemptQuestion.find({
    attempt: attempt._id,
    isActive: true,
  });

  const attemptQuestionIds = attemptQuestions.map((aq) => aq._id);

  // Resolve each attempt question to its question details so the review
  // screen can render text, options, marks and (when allowed) the
  // correct answer and explanation.
  const assessmentQuestions = await AssessmentQuestion.find({
    _id: { $in: attemptQuestions.map((aq) => aq.assessmentQuestion) },
  }).populate("question");

  const assessmentQuestionByAttemptQuestion = new Map();
  attemptQuestions.forEach((aq) => {
    assessmentQuestionByAttemptQuestion.set(
      aq._id.toString(),
      assessmentQuestions.find(
        (item) => item._id.toString() === aq.assessmentQuestion.toString(),
      ),
    );
  });

  const showCorrect = attempt.assessment?.showCorrectAnswers !== false;

  const buildReviewItem = (answer, assessmentQuestion) => {
    const question = assessmentQuestion?.question ?? null;

    return {
      _id: answer?._id ?? null,
      question: question
        ? {
            _id: question._id,
            question: question.question,
            options: question.options,
            ...(showCorrect
              ? {
                  correctAnswer: question.correctAnswer,
                  explanation: question.explanation,
                }
              : {}),
          }
        : null,
      marks: assessmentQuestion?.marks ?? 0,
      order: assessmentQuestion?.order ?? 0,
      selectedAnswer: answer?.selectedAnswer ?? null,
      isCorrect: answer?.isCorrect ?? false,
      marksAwarded: answer?.marksAwarded ?? 0,
      answeredAt: answer?.answeredAt ?? null,
    };
  };

  const rawAnswers = await StudentAnswer.find({
    studentAttemptQuestion: { $in: attemptQuestionIds },
    isActive: true,
  });

  const answers = rawAnswers.map((answer) =>
    buildReviewItem(
      answer,
      assessmentQuestionByAttemptQuestion.get(
        answer.studentAttemptQuestion.toString(),
      ),
    ),
  );

  // Include never-answered (skipped) questions so the review is complete.
  const answeredAttemptQuestionIds = new Set(
    rawAnswers.map((answer) => answer.studentAttemptQuestion.toString()),
  );

  attemptQuestions.forEach((aq) => {
    if (answeredAttemptQuestionIds.has(aq._id.toString())) return;

    answers.push(
      buildReviewItem(
        null,
        assessmentQuestionByAttemptQuestion.get(aq._id.toString()),
      ),
    );
  });

  answers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    attempt,
    answers,
  };
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export default {
  saveAnswer,
  clearAnswer,
  getAnswer,
  getAnswers,
  reviewAnswers,
};
