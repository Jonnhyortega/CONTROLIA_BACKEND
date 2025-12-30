import connectDB from '../src/config/db_temp.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

(async () => {
  try {
    console.log("DEBUG: Connecting to DB...");
    await connectDB();
    console.log("DEBUG: Connected. Listing collections...");
    const cols = await mongoose.connection.db.listCollections().toArray();
    console.log("DEBUG: Collections:", cols.map(c => c.name).join(', '));
    process.exit(0);
  } catch (e) {
    console.error("DEBUG ERROR:", e);
    process.exit(1);
  }
})();
