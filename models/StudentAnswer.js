import { Schema, model } from "mongoose";

const studentAnswerSchema = new Schema(
  {
    studentAttemptQuestion: {
      type: Schema.Types.ObjectId,
      ref: "StudentAttemptQuestion",
      required: true,
      unique: true,
      index: true,
    },

    selectedAnswer: {
      type: String,
      trim: true,
      default: null,
    },

    isCorrect: {
      type: Boolean,
      default: false,
      index: true,
    },

    marksAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },

    answeredAt: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// The most common query during live exams: find one answer by attempt + question.
// Without this compound index, every answer save during a 1,000-student exam
// session performs a collection scan. This is the highest-frequency write path
// in the entire system.
studentAnswerSchema.index({ studentAttemptQuestion: 1, isActive: 1 });

const StudentAnswer = model("StudentAnswer", studentAnswerSchema);

export default StudentAnswer;
