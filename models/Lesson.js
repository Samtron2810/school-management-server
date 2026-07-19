import { Schema, model } from "mongoose";

const lessonSchema = new Schema(
  {
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

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    week: {
      type: Number,
      required: true,
      min: 1,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    publishedAt: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
    toObject: {
      virtuals: true,
      versionKey: false,
    },
  },
);

lessonSchema.index({
  classSubject: 1,
  session: 1,
  term: 1,
});

lessonSchema.index({
  teacher: 1,
});

lessonSchema.index({
  teacherAssignment: 1,
});

const Lesson = model("Lesson", lessonSchema);

export default Lesson;
