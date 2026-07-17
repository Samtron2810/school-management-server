import mongoose from "mongoose";

import env from "../config/env.js";

import connectDB from "../config/db.js";

import User from "../models/User.js";

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      process.exit(0);
    }

    const admin = await User.create({
      firstName: "System",
      lastName: "Administrator",
      otherName: "TronSchool",
      username: "admin",
      email: "admin@tronschool.com",
      password: "Admin@123",
      role: "admin",
      phoneNumber: "",
    });

    console.log("Admin account created successfully.");

    console.log({
      username: admin.username,
      email: admin.email,
      password: "Admin@123",
    });

    process.exit(0);
  } catch (error) {
    console.error(error.message);

    process.exit(1);
  }
};

seedAdmin();
