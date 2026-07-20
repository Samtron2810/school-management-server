import { Schema, model } from "mongoose";

const assessmentSchema = new Schema(
  {
    teacherAssignment: {
      type: Schema.Types.ObjectId,
      ref: "TeacherAssignment",
      required: true,
    },

    classSubject: {
      type: Schema.Types.ObjectId,
      ref: "ClassSubject",
      required: true,
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    session: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    term: {
      type: Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    instructions: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: ["Assignment", "Quiz", "Test", "Examination"],
      required: true,
    },

    totalMarks: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number,
      required: true,
    },

    passingScore: {
      type: Number,
      default: 40,
    },

    maxAttempts: {
      type: Number,
      default: 1,
    },

    shuffleQuestions: {
      type: Boolean,
      default: false,
    },

    shuffleOptions: {
      type: Boolean,
      default: false,
    },

    showScoreImmediately: {
      type: Boolean,
      default: true,
    },

    showCorrectAnswers: {
      type: Boolean,
      default: false,
    },

    availableFrom: {
      type: Date,
      required: true,
    },

    availableTo: {
      type: Date,
      required: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    requiredQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    bonusQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

assessmentSchema.index({
  teacherAssignment: 1,
});

assessmentSchema.index({
  classSubject: 1,
});

assessmentSchema.index({
  teacher: 1,
});

assessmentSchema.index({
  session: 1,
  term: 1,
});

assessmentSchema.index({
  availableFrom: 1,
  availableTo: 1,
});

const Assessment = model("Assessment", assessmentSchema);

export default Assessment;
