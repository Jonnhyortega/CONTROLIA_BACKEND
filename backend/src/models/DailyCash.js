import mongoose from "mongoose";

const dailyCashSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    sales: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sale" }],

    totalSalesAmount: { type: Number, default: 0 },
    totalOperations: { type: Number, default: 0 },

    extraExpenses: [
      { description: String, amount: Number },
    ],
    supplierPayments: [
      { metodo: String, total: Number },
    ],
    description: {
      type: String,
      default: "",
      trim: true
    },
    totalOut: { type: Number, default: 0 },
    finalExpected: { type: Number, default: 0 },
    finalReal: { type: Number, default: 0 },
    difference: { type: Number, default: 0 },
    status: { type: String, enum: ["abierta", "cerrada"], default: "abierta" },
  },
  { timestamps: true }
);

// Evita duplicados por usuario + fecha
dailyCashSchema.index({ user: 1, date: 1 });

export default mongoose.model("DailyCash", dailyCashSchema);
