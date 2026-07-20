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

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

studentAnswerSchema.index({
  isCorrect: 1,
});

const StudentAnswer = model("StudentAnswer", studentAnswerSchema);

export default StudentAnswer;
