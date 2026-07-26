import { Schema, model } from "mongoose";

const classSubjectSchema = new Schema(
  {
    schoolClass: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
    },

    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    isCompulsory: {
      type: Boolean,
      default: true,
    },

    // Mark-entry columns for this class+subject (quiz, assignment, test,
    // exam, etc). isActive controls whether a column counts toward the
    // total; turning it off keeps any scores already entered.
    scoreComponents: {
      type: [
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
          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],
      default: () => [
        { key: "quiz", label: "Quiz", maxMarks: 10, isActive: true },
        { key: "assignment", label: "Assignment", maxMarks: 10, isActive: true },
        { key: "test", label: "Test", maxMarks: 20, isActive: true },
        { key: "exam", label: "Examination", maxMarks: 60, isActive: true },
      ],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

classSubjectSchema.index(
  {
    schoolClass: 1,
    subject: 1,
  },
  {
    unique: true,
  },
);

const ClassSubject = model("ClassSubject", classSubjectSchema);

export default ClassSubject;
