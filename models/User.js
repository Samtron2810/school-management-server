import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    otherName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [50, "Other name cannot exceed 50 characters"],
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ["admin", "teacher", "student", "parent"],
        message: "{VALUE} is not a valid role",
      },
      required: true,
    },

    avatar: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        delete ret.__v;

        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

// userSchema.index({ email: 1 });
// userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS = 10;
  const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  // If a previous lock has expired, reset and start fresh
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  if (this.failedLoginAttempts + 1 >= MAX_ATTEMPTS) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

userSchema.virtual("fullName").get(function () {
  return [this.firstName, this.otherName, this.lastName]
    .filter(Boolean)
    .join(" ");
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.compareRefreshToken = async function (refreshToken) {
  return await bcrypt.compare(refreshToken, this.refreshToken);
};

const User = model("User", userSchema);

export default User;
