import { Schema, model } from "mongoose";

const termSchema = new Schema(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    name: {
      type: String,
      enum: {
        values: ["First Term", "Second Term", "Third Term"],
        message: "{VALUE} is not a valid term.",
      },
      required: [true, "Term name is required"],
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

termSchema.index(
  {
    session: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

const Term = model("Term", termSchema);

export default Term;
