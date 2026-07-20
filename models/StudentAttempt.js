import { Schema, model } from "mongoose";

const studentAttemptSchema = new Schema(
  {
    assessment: {
      type: Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },

    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["In Progress", "Submitted", "Auto Submitted", "Cancelled"],
      default: "In Progress",
      index: true,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    answeredQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    flaggedQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    gradedAt: {
      type: Date,
      default: null,
    },

    gradingVersion: {
      type: Number,
      default: 1,
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

studentAttemptSchema.index(
  {
    assessment: 1,
    student: 1,
    attemptNumber: 1,
  },
  {
    unique: true,
  },
);

studentAttemptSchema.index({
  student: 1,
  status: 1,
});

studentAttemptSchema.index({
  expiresAt: 1,
  status: 1,
});

const StudentAttempt = model("StudentAttempt", studentAttemptSchema);

export default StudentAttempt;
