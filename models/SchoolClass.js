import { Schema, model } from "mongoose";

const schoolClassSchema = new Schema(
  {
    level: {
      type: String,
      enum: ["Creche", "Nursery", "Primary", "JSS", "SSS"],
      required: [true, "Level is required"],
    },

    className: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
    },

    arm: {
      type: String,
      required: [true, "Class arm is required"],
      trim: true,
      uppercase: true,
    },

    description: {
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
  },
);

schoolClassSchema.index(
  {
    level: 1,
    className: 1,
    arm: 1,
  },
  {
    unique: true,
  },
);

schoolClassSchema.virtual("fullName").get(function () {
  return `${this.className} ${this.arm}`;
});

schoolClassSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret.__v;
    return ret;
  },
});

const SchoolClass = model("SchoolClass", schoolClassSchema);

export default SchoolClass;
