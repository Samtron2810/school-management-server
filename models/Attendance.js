import { Schema, model } from "mongoose";

const attendanceSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

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

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Excused"],
      default: "Present",
    },

    remark: {
      type: String,
      trim: true,
      default: "",
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

attendanceSchema.index(
  {
    student: 1,
    classSubject: 1,
    date: 1,
  },
  {
    unique: true,
  },
);

attendanceSchema.index({
  classSubject: 1,
  date: 1,
});

attendanceSchema.index({
  teacher: 1,
});

attendanceSchema.index({
  session: 1,
  term: 1,
});

const Attendance = model("Attendance", attendanceSchema);

export default Attendance;
