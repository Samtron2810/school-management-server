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
