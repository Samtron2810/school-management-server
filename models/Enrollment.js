import { Schema, model } from "mongoose";

const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
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

    schoolClass: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
    },

    enrollmentNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    rollNumber: {
      type: Number,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Active", "Transferred", "Graduated", "Withdrawn", "Suspended"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
);

enrollmentSchema.index(
  {
    student: 1,
    session: 1,
    term: 1,
  },
  {
    unique: true,
  },
);

const Enrollment = model("Enrollment", enrollmentSchema);

export default Enrollment;
