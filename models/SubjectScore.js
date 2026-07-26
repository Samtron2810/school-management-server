import { Schema, model } from "mongoose";

// One document per (student, classSubject, session, term). Holds every
// mark-entry column (quiz/assignment/test/exam/...) for that subject, plus
// the computed total. Columns are keyed dynamically to match
// ClassSubject.scoreComponents[].key, so a Map is used instead of fixed
// fields.
const subjectScoreSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    classSubject: {
      type: Schema.Types.ObjectId,
      ref: "ClassSubject",
      required: true,
      index: true,
    },

    session: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    term: {
      type: Schema.Types.ObjectId,
      ref: "Term",
      required: true,
      index: true,
    },

    // { quiz: 8, assignment: null, test: 18, exam: null }
    // Value is null until filled (manually or via a graded assessment).
    scores: {
      type: Map,
      of: Number,
      default: {},
    },

    // Which attempt last wrote each column, e.g. { quiz: attemptId }.
    // Used so a later attempt of the same type can overwrite the right
    // value without clobbering a manually-entered figure from a different
    // source by accident (informational — manual edits simply overwrite).
    sourceAttempts: {
      type: Map,
      of: Schema.Types.ObjectId,
      default: {},
    },

    // Computed from active scoreComponents only; recalculated on every save.
    total: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMaxMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    grade: {
      type: String,
      default: "",
      trim: true,
    },

    gradePoint: {
      type: Number,
      default: 0,
      min: 0,
    },

    remark: {
      type: String,
      default: "",
      trim: true,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    // Per-student override. A student can only view/download once BOTH
    // this is true AND the class-level ReportCardBatch is published.
    isPublished: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

subjectScoreSchema.index(
  {
    student: 1,
    classSubject: 1,
    term: 1,
  },
  {
    unique: true,
  },
);

subjectScoreSchema.index({
  classSubject: 1,
  session: 1,
  term: 1,
});

const SubjectScore = model("SubjectScore", subjectScoreSchema);

export default SubjectScore;
