import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/controlia";

const migrateMemberships = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // Update 'medium' -> 'gestion'
    const resultMedium = await User.updateMany(
      { membershipTier: "medium" },
      { $set: { membershipTier: "gestion" } }
    );
    console.log(`Updated ${resultMedium.modifiedCount} users from 'medium' to 'gestion'.`);

    // Update 'pro' -> 'avanzado'
    const resultPro = await User.updateMany(
      { membershipTier: "pro" },
      { $set: { membershipTier: "avanzado" } }
    );
    console.log(`Updated ${resultPro.modifiedCount} users from 'pro' to 'avanzado'.`);

    console.log("Migration finished.");
    process.exit(0);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
};

migrateMemberships();
