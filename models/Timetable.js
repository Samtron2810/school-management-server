import { Schema, model } from "mongoose";

// One period on the weekly class timetable. Created by admins against a
// teacher assignment (which anchors subject/class/session/term); read by
// teachers (own periods), students and parents (their class periods).
const timetableSchema = new Schema(
  {
    schoolClass: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
      index: true,
    },

    classSubject: {
      type: Schema.Types.ObjectId,
      ref: "ClassSubject",
      required: true,
      index: true,
    },

    teacherAssignment: {
      type: Schema.Types.ObjectId,
      ref: "TeacherAssignment",
      required: true,
      index: true,
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
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

    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },

    // Stored as "HH:MM" 24-hour strings — easy to sort and render.
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
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

// A class can't have two periods at the same slot in the same term.
timetableSchema.index(
  {
    schoolClass: 1,
    session: 1,
    term: 1,
    dayOfWeek: 1,
    startTime: 1,
  },
  { unique: true },
);

const Timetable = model("Timetable", timetableSchema);

export default Timetable;
