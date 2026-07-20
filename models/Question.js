import { Schema, model } from "mongoose";

const optionSchema = new Schema(
  {
    key: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const questionSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
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

    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [optionSchema],
      validate: {
        validator(value) {
          return value.length === 4;
        },
        message: "A question must contain exactly four options.",
      },
    },

    correctAnswer: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },

    explanation: {
      type: String,
      default: "",
      trim: true,
    },

    marks: {
      type: Number,
      default: 1,
      min: 1,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
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

questionSchema.index({
  teacher: 1,
});

questionSchema.index({
  classSubject: 1,
});

questionSchema.index({
  session: 1,
  term: 1,
});

questionSchema.index({
  difficulty: 1,
});

questionSchema.index({
  isPublished: 1,
});

const Question = model("Question", questionSchema);

export default Question;
