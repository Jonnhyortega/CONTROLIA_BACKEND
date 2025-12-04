// models/Customization.js
import mongoose from "mongoose";

const customizationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    businessName: { type: String, default: "Mi Comercio" },

    logoUrl: { type: String, default: "" },

    primaryColor: { type: String, default: "#2563eb" },
    secondaryColor: { type: String, default: "#1e40af" },

    theme: { type: String, enum: ["light", "dark"], default: "dark" },
    categories: { type: [String], default: [] },

    currency: { type: String, default: "ARS" },

    dateFormat: { type: String, default: "DD/MM/YYYY" },
    timeFormat: { type: String, default: "HH:mm" },
  },
  { timestamps: true }
);

export default mongoose.model("Customization", customizationSchema);
