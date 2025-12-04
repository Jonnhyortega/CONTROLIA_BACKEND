import mongoose from "mongoose";
import dotenv from "dotenv";
import DailyCash from "../models/DailyCash.js";

dotenv.config();

const fixOldCashDates = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  // console.log("🧭 Conectado a MongoDB...");

  const wrongCashes = await DailyCash.find({
    "date": { $exists: true },
  });

  let updatedCount = 0;

  for (const cash of wrongCashes) {
    const d = new Date(cash.date);
    // Si la hora es 00:00Z, es antigua → sumamos 3h
    if (d.getUTCHours() === 0) {
      const fixed = new Date(d.getTime() + 3 * 60 * 60 * 1000);
      cash.date = fixed;
      await cash.save();
      updatedCount++;
      // console.log(`✅ ${cash._id} corregida: ${d.toISOString()} → ${fixed.toISOString()}`);
    }
  }

  // console.log(`🧩 ${updatedCount} registros corregidos`);
  process.exit(0);
};

fixOldCashDates();
