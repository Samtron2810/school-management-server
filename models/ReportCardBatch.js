import { Schema, model } from "mongoose";

// Tracks whether report cards for an entire class have been published for
// a session+term. Publishing this does NOT force-publish every student —
// SubjectScore.isPublished can still be turned off per-student afterward.
// A student/parent can see a report card only when both this batch is
// published AND that student's relevant SubjectScore rows are published.
const reportCardBatchSchema = new Schema(
  {
    schoolClass: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
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

    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    unpublishedAt: {
      type: Date,
      default: null,
    },

    unpublishedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reportCardBatchSchema.index(
  {
    schoolClass: 1,
    session: 1,
    term: 1,
  },
  {
    unique: true,
  },
);

const ReportCardBatch = model("ReportCardBatch", reportCardBatchSchema);

export default ReportCardBatch;
