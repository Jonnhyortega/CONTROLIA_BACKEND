import mongoose from "mongoose";

const productHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // El usuario que realizó el cambio (empleado o admin)
    },
    action: {
      type: String,
      enum: ["create", "update", "delete", "stock_adjustment"],
      required: true,
    },
    changes: {
      type: Map,
      of: new mongoose.Schema({
        old: mongoose.Schema.Types.Mixed,
        new: mongoose.Schema.Types.Mixed,
      }, { _id: false }),
    },
    description: {
      type: String, // Texto descriptivo opcional (ej: "Ajuste de stock manual")
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProductHistory", productHistorySchema);
