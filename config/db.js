import mongoose from "mongoose";
import env from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      // Allow up to 20 concurrent DB operations before queuing.
      // Default is 5, which exhausts quickly under moderate load.
      maxPoolSize: 20,
      // How long (ms) a socket can sit idle before being closed.
      socketTimeoutMS: 45000,
      // How long (ms) to wait for a connection before throwing.
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Failed");
    console.error(error.message);

    process.exit(1);
  }
};

export default connectDB;
