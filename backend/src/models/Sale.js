import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "reverted"],
      default: "active",
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // El usuario real que hizo la venta (empleado o admin)
      required: false,
    },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: false },
        name: { type: String, required: false }, // ✅ NUEVO: nombre manual si no hay productId
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["efectivo", "tarjeta", "transferencia", "otro", "mercado pago"],
      default: "efectivo",
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 🚀 Índice para mejorar búsquedas de ventas por usuario y fecha
saleSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Sale", saleSchema);
