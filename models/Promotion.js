import { Schema, model } from "mongoose";

const promotionResultSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    fromEnrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
    },

    toEnrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
    },

    status: {
      type: String,
      enum: ["Promoted", "Transferred", "Graduated", "Skipped", "Failed"],
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const promotionSchema = new Schema(
  {
    sourceSession: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    sourceTerm: {
      type: Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },

    targetSession: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    targetTerm: {
      type: Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },

    fromClass: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
    },

    toClass: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
    },

    promotedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      default: "Student Promotion",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    totalStudents: {
      type: Number,
      default: 0,
      min: 0,
    },

    promotedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    skippedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    failedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Completed", "Partial", "Failed"],
      default: "Completed",
    },

    promotedAt: {
      type: Date,
      default: Date.now,
    },

    results: {
      type: [promotionResultSchema],
      default: [],
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

promotionSchema.index({
  sourceSession: 1,
  sourceTerm: 1,
});

promotionSchema.index({
  targetSession: 1,
  targetTerm: 1,
});

promotionSchema.index({
  fromClass: 1,
  toClass: 1,
});

const Promotion = model("Promotion", promotionSchema);

export default Promotion;
