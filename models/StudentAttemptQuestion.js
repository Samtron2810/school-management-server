import { Schema, model } from "mongoose";

const studentAttemptQuestionSchema = new Schema(
  {
    attempt: {
      type: Schema.Types.ObjectId,
      ref: "StudentAttempt",
      required: true,
      index: true,
    },

    assessmentQuestion: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentQuestion",
      required: true,
      index: true,
    },

    displayOrder: {
      type: Number,
      required: true,
      min: 1,
    },

    optionOrder: {
      type: [Number],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: "optionOrder must contain at least two values.",
      },
    },

    isVisited: {
      type: Boolean,
      default: false,
      index: true,
    },

    isAnswered: {
      type: Boolean,
      default: false,
      index: true,
    },

    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },

    visitedAt: {
      type: Date,
      default: null,
    },

    answeredAt: {
      type: Date,
      default: null,
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

studentAttemptQuestionSchema.index(
  {
    attempt: 1,
    displayOrder: 1,
  },
  {
    unique: true,
  },
);

studentAttemptQuestionSchema.index(
  {
    attempt: 1,
    assessmentQuestion: 1,
  },
  {
    unique: true,
  },
);

studentAttemptQuestionSchema.index({
  attempt: 1,
  isVisited: 1,
});

studentAttemptQuestionSchema.index({
  attempt: 1,
  isAnswered: 1,
});

studentAttemptQuestionSchema.index({
  attempt: 1,
  isFlagged: 1,
});

const StudentAttemptQuestion = model(
  "StudentAttemptQuestion",
  studentAttemptQuestionSchema,
);

export default StudentAttemptQuestion;
