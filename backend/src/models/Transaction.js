
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["CLIENT_PAYMENT", "SUPPLIER_PAYMENT", "CLIENT_DEBT", "SUPPLIER_DEBT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String, // Cloudinary URL
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // This will be the employee or admin who executed the action
      required: true, 
    },
    user: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", // Multi-tenancy: The admin owner of the data
      required: true 
    }
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
