import { Schema, model } from "mongoose";

const announcementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    targetRoles: {
      type: [String],
      enum: ["admin", "teacher", "student", "parent"],
      default: ["admin", "teacher", "student", "parent"],
    },

    targetClasses: [
      {
        type: Schema.Types.ObjectId,
        ref: "SchoolClass",
      },
    ],

    targetStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    targetParents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Parent",
      },
    ],

    publishAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Urgent"],
      default: "Normal",
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

announcementSchema.index({
  targetRoles: 1,
  isActive: 1,
  publishAt: -1,
});

announcementSchema.index({
  isPinned: 1,
  publishAt: -1,
});

const Announcement = model("Announcement", announcementSchema);

export default Announcement;
