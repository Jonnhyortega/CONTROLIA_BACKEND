import mongoose from "mongoose";

const migrationSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  executedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
});

const Migration = mongoose.model("Migration", migrationSchema);
export default Migration;
