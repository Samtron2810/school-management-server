import { Schema, model } from "mongoose";

const lessonAttachmentSchema = new Schema(
  {
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    resourceType: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
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

lessonAttachmentSchema.index({
  lesson: 1,
  isActive: 1,
});

lessonAttachmentSchema.index({
  uploadedBy: 1,
});

lessonAttachmentSchema.index({
  fileType: 1,
});

// lessonAttachmentSchema.index({
//   resourceType: 1,
// });

const LessonAttachment = model("LessonAttachment", lessonAttachmentSchema);

export default LessonAttachment;
