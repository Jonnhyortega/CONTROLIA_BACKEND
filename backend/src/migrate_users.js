
import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

const migrateUsers = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB para migración...");

    // 1. Set Defaults for fields that might be missing
    // We use updateMany with $set to ensure fields exist, 
    // but we use a filter to check existence if we want to be safe, 
    // or just set defaults for everyone if it's safe (idempotent).
    
    // Strategy: Use $set for fields where we have a clear default for legacy users.
    
    console.log("🔄 Iniciando actualización de usuarios...");

    const result = await User.updateMany(
      {}, // Filter: All users
      [
        // Pipeline update allows referencing current values or cond logic
        // But simple object update with $set is easier if we just want defaults where missing.
        // However, standard updateMany with $set overwrites.
        // We want "set if missing". Mongo doesn't have direct $setIfMissing for many.
        // We can use the aggregation pipeline form of update.
        {
          $set: {
            // Fields needing defaults
            address: { $ifNull: ["$address", ""] },
            role: { $ifNull: ["$role", "admin"] },
            active: { $ifNull: ["$active", false] }, // Legacy users might be active? Or inactive? Let's assume false or check logic.
            // Safety: If legacy users were working, 'active' might need to be true? 
            // Better strategy: If membershipTier is missing, set to basic.
            membershipTier: { $ifNull: ["$membershipTier", "basic"] },
            membershipStartDate: { $ifNull: ["$membershipStartDate", "$createdAt"] }, // Use creation date if missing
            isEmailVerified: { $ifNull: ["$isEmailVerified", false] },
            subscriptionStatus: { $ifNull: ["$subscriptionStatus", null] },
            emergencyAccessExpires: { $ifNull: ["$emergencyAccessExpires", null] },
            emergencyAccessLastUsedAt: { $ifNull: ["$emergencyAccessLastUsedAt", null] },
            // Ensure businessName exists (required), assumes legacy has it or name.
            businessName: { $ifNull: ["$businessName", "Negocio Sin Nombre"] } 
          }
        }
      ]
    );

    console.log(`✅ Migración completada.`);
    console.log(`Documents matched: ${result.matchedCount}`);
    console.log(`Documents modified: ${result.modifiedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error en migración:", error);
    process.exit(1);
  }
};

migrateUsers();
