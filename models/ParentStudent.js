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
      trim: true,
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
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
    toObject: {
      virtuals: true,
      versionKey: false,
    },
  },
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

// Prevent duplicate parent-student relationships
parentStudentSchema.index(
  {
    parent: 1,
    student: 1,
  },
  {
    unique: true,
  },
);

// Fast lookup of a student's parents
parentStudentSchema.index({
  student: 1,
  isActive: 1,
});

// Fast lookup of a parent's children
parentStudentSchema.index({
  parent: 1,
  isActive: 1,
});

// Fast lookup when checking relationship rules
parentStudentSchema.index({
  student: 1,
  relationship: 1,
  isActive: 1,
});

// Fast lookup for primary contact
parentStudentSchema.index({
  student: 1,
  isPrimaryContact: 1,
  isActive: 1,
});

// Fast lookup for emergency contact
parentStudentSchema.index({
  student: 1,
  isEmergencyContact: 1,
  isActive: 1,
});

const ParentStudent = model("ParentStudent", parentStudentSchema);

export default ParentStudent;
