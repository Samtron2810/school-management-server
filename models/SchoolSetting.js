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
