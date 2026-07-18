import { Schema, model } from "mongoose";

const parentStudentSchema = new Schema(
  {
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
    },

    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    relationship: {
      type: String,
      enum: [
        "Father",
        "Mother",
        "Guardian",
        "Grandfather",
        "Grandmother",
        "Uncle",
        "Aunt",
        "Brother",
        "Sister",
        "Other",
      ],
      required: true,
    },

    isPrimaryContact: {
      type: Boolean,
      default: false,
    },

    canReceiveResults: {
      type: Boolean,
      default: true,
    },

    canPickupStudent: {
      type: Boolean,
      default: true,
    },

    isEmergencyContact: {
      type: Boolean,
      default: false,
    },

    livesWithStudent: {
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

parentStudentSchema.index(
  {
    parent: 1,
    student: 1,
  },
  {
    unique: true,
  },
);

const ParentStudent = model("ParentStudent", parentStudentSchema);

export default ParentStudent;
