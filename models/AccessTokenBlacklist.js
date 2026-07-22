import { Schema, model } from "mongoose";

const accessTokenBlacklistSchema = new Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "logout",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

accessTokenBlacklistSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

const AccessTokenBlacklist = model(
  "AccessTokenBlacklist",
  accessTokenBlacklistSchema,
);

export default AccessTokenBlacklist;
