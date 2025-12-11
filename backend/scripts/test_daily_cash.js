import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../src/config/db_temp.js";
import User from "../src/models/User.js";
import "../src/models/Product.js";
import "../src/models/Sale.js";
import "../src/models/DailyCash.js";
import { getClosedCashDays } from "../src/controllers/dailyCashController.js";

dotenv.config();

const runTest = async () => {
  try {
    await connectDB();

    // Find ANY user
    const user = await User.findOne();
    if (!user) {
      console.error("❌ No users found in DB");
      process.exit(1);
    }
    console.log("👤 Testing with user:", user.email, "ID:", user._id);

    // Mock Req/Res
    const req = {
      user: user, // Simulate auth middleware
      query: { includeDetails: "true" } // Simulate query param
    };

    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`\n📦 Response Status: ${code}`);
          if (Array.isArray(data) && data.length > 0) {
             const firstDay = data[0];
             console.log("📅 First Day keys:", Object.keys(firstDay));
             if (firstDay.sales) {
                console.log("✅ 'sales' field IS present.");
                if (Array.isArray(firstDay.sales) && firstDay.sales.length > 0) {
                     console.log("🛒 Sales count:", firstDay.sales.length);
                     console.log("🔍 First sale sample:", JSON.stringify(firstDay.sales[0], null, 2));
                } else {
                     console.log("⚠️ Sales array is empty.");
                }
             } else {
                console.log("❌ 'sales' field is MISSING.");
             }
          } else {
            console.log("⚠️ No daily cash records found.");
             console.log(data);
          }
        }
      })
    };

    console.log("\n🚀 Calling getClosedCashDays with includeDetails='true'...");
    await getClosedCashDays(req, res);

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.connection.close();
  }
};

runTest();
