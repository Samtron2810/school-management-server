import { Schema, model } from "mongoose";

const classTeacherAssignmentSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    schoolClass: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
    },

    session: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
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

// One class can only have one class teacher per session
classTeacherAssignmentSchema.index(
  {
    schoolClass: 1,
    session: 1,
  },
  {
    unique: true,
  },
);

// A teacher can only be class teacher of one class per session
classTeacherAssignmentSchema.index(
  {
    teacher: 1,
    session: 1,
  },
  {
    unique: true,
  },
);

const ClassTeacherAssignment = model(
  "ClassTeacherAssignment",
  classTeacherAssignmentSchema,
);

export default ClassTeacherAssignment;
