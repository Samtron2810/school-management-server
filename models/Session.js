import { Schema, model } from "mongoose";

const sessionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Session name is required"],
      unique: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

sessionSchema.index({ isCurrent: 1 });

const Session = model("Session", sessionSchema);

export default Session;
