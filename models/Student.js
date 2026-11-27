import { Schema, model } from "mongoose";

const studentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },

    // Optional — some schools don't have it at admission.
    dateOfBirth: {
      type: Date,
      default: null,
    },

    admissionDate: {
      type: Date,
      required: true,
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    bloodGroup: {
      type: String,
      default: "",
    },

    genotype: {
      type: String,
      default: "",
    },

    nationality: {
      type: String,
      default: "Nigeria",
    },

    stateOfOrigin: {
      type: String,
      default: "",
    },

    localGovernment: {
      type: String,
      default: "",
    },

    religion: {
      type: String,
      default: "",
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

studentSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Student = model("Student", studentSchema);

export default Student;
