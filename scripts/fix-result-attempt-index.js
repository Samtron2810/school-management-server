// One-off fix for: E11000 duplicate key error ... index: attempt_1 dup key: { attempt: null }
//
// Cause: the `attempt` field on Result was made `sparse: true` in the
// schema, but the index already existed on disk as a plain (non-sparse)
// unique index. Mongoose does not alter existing indexes automatically, so
// every manually-entered result (attempt: null) collided with the first
// one already saved.
//
// This drops the stale index and lets Mongoose recreate it correctly
// (unique + sparse) on next connect via Result.syncIndexes().
//
// Usage: node scripts/fix-result-attempt-index.js

import mongoose from "mongoose";
import env from "../config/env.js";
import Result from "../models/Result.js";

const run = async () => {
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const collection = mongoose.connection.collection("results");
  const indexes = await collection.indexes();
  const staleIndex = indexes.find((index) => index.name === "attempt_1");

  if (!staleIndex) {
    console.log('No "attempt_1" index found — nothing to drop.');
  } else if (staleIndex.sparse) {
    console.log('"attempt_1" index is already sparse — nothing to do.');
  } else {
    console.log('Dropping stale non-sparse "attempt_1" index...');
    await collection.dropIndex("attempt_1");
    console.log("Dropped.");
  }

  console.log("Recreating indexes from the current schema...");
  await Result.syncIndexes();
  console.log("Done. Result indexes now match the schema (unique + sparse).");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
