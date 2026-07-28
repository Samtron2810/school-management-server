import { Schema, model } from "mongoose";

// Single document holding school-wide configuration (singleton pattern —
// always fetched/updated via setting.service's getSettings()).
const gradeBandSchema = new Schema(
  {
    grade: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    minScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
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
  },
  { _id: false },
);

const idFormatSchema = new Schema(
  {
    prefix: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    padding: {
      type: Number,
      default: 4,
      min: 2,
      max: 10,
    },
    // Issued numbers come from atomically incrementing this counter.
    counter: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

// Global mark-entry columns (e.g. CA 1, CA 2, Test, Exam). School-wide and
// admin-only — every class and every subject shares this same set, so
// report cards are consistent no matter which teacher entered the scores.
const scoreComponentSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    // Inactive components stay visible (read-only) on the mark-entry grid
    // so past scores remain visible, but are excluded from the total.
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const schoolSettingSchema = new Schema(
  {
    schoolName: {
      type: String,
      default: "TronSchool",
      trim: true,
    },

    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // Score thresholds used when grading results (percentage >= minScore).
    gradeBands: {
      type: [gradeBandSchema],
      default: [
        { grade: "A", minScore: 70, gradePoint: 5, remark: "Excellent" },
        { grade: "B", minScore: 60, gradePoint: 4, remark: "Very Good" },
        { grade: "C", minScore: 50, gradePoint: 3, remark: "Good" },
        { grade: "D", minScore: 45, gradePoint: 2, remark: "Fair" },
        { grade: "E", minScore: 40, gradePoint: 1, remark: "Pass" },
        { grade: "F", minScore: 0, gradePoint: 0, remark: "Fail" },
      ],
    },

    // Percentage at or above which a result counts as a pass.
    passingScore: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
    },

    // Global mark-entry columns, shared by every class and subject
    // school-wide. Only admin can rename or toggle these (see
    // setting.service.js#updateScoreComponents); teachers see them as
    // fixed, read-only column definitions on the Mark Entries grid.
    scoreComponents: {
      type: [scoreComponentSchema],
      default: () => [
        { key: "ca1", label: "CA 1", maxMarks: 10, isActive: true },
        { key: "ca2", label: "CA 2", maxMarks: 10, isActive: true },
        { key: "test", label: "Test", maxMarks: 20, isActive: true },
        { key: "exam", label: "Exam", maxMarks: 60, isActive: true },
      ],
    },

    // Auto-ID sequences for teacherId / admissionNumber / parentId.
    idFormats: {
      teacher: {
        type: idFormatSchema,
        default: () => ({ prefix: "TCH-", padding: 4, counter: 0 }),
      },
      student: {
        type: idFormatSchema,
        default: () => ({ prefix: "STU-", padding: 4, counter: 0 }),
      },
      parent: {
        type: idFormatSchema,
        default: () => ({ prefix: "PAR-", padding: 4, counter: 0 }),
      },
    },
  },
  {
    timestamps: true,
  },
);

const SchoolSetting = model("SchoolSetting", schoolSettingSchema);

export default SchoolSetting;
