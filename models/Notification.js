import { Schema, model } from "mongoose";

// Lightweight in-app notification feed. Notifications are emitted by
// server-side events (new announcement, published result, etc.) and
// fanned out to the affected users.
const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["announcement", "result", "assessment", "lesson", "general"],
      default: "general",
      index: true,
    },

    // Optional in-app destination (e.g. "/student/my-results").
    link: {
      type: String,
      default: "",
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = model("Notification", notificationSchema);

export default Notification;
