import { Schema, model } from "mongoose";

const resultSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    assessment: {
      type: Schema.Types.ObjectId,
      ref: "Assessment",
      default: null,
      index: true,
    },

    attempt: {
      type: Schema.Types.ObjectId,
      ref: "StudentAttempt",
      default: null,
      unique: true,
      sparse: true,
      index: true,
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
      index: true,
    },

    teacherAssignment: {
      type: Schema.Types.ObjectId,
      ref: "TeacherAssignment",
      default: null,
      index: true,
    },

    classSubject: {
      type: Schema.Types.ObjectId,
      ref: "ClassSubject",
      default: null,
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

    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["Assignment", "Quiz", "Test", "Examination", "Manual"],
      default: "Manual",
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMarks: {
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
      default: "F",
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

    correctAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    skippedQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    gradedAt: {
      type: Date,
      default: null,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    metadata: {
      className: {
        type: String,
        default: "",
      },
      subjectName: {
        type: String,
        default: "",
      },
      assessmentName: {
        type: String,
        default: "",
      },
    },

    isPublished: {
      type: Boolean,
      default: true,
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

resultSchema.index({
  student: 1,
  session: 1,
  term: 1,
});

resultSchema.index({
  assessment: 1,
  student: 1,
});

resultSchema.index({
  classSubject: 1,
  session: 1,
  term: 1,
});

const Result = model("Result", resultSchema);

export default Result;
