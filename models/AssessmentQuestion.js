import { Schema, model } from "mongoose";

const assessmentQuestionSchema = new Schema(
  {
    assessment: {
      type: Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },

    question: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    marks: {
      type: Number,
      default: 1,
      min: 1,
    },

    isBonus: {
      type: Boolean,
      default: false,
    },

    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

assessmentQuestionSchema.index(
  {
    assessment: 1,
    question: 1,
  },
  {
    unique: true,
  },
);

assessmentQuestionSchema.index({
  assessment: 1,
});

assessmentQuestionSchema.index({
  question: 1,
});

assessmentQuestionSchema.index({
  assessment: 1,
  order: 1,
});

const AssessmentQuestion = model(
  "AssessmentQuestion",
  assessmentQuestionSchema,
);

export default AssessmentQuestion;
