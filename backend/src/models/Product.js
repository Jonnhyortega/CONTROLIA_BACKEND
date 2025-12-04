import mongoose from "mongoose";


const productSchema = new mongoose.Schema(
{
name: { type: String, required: true, trim: true },
category: { type: String, required: true },
price: { type: Number, required: true },
cost: { type: Number, required: true },
stock: { type: Number, required: true, default: 0 },
barcode: { type: String, unique: true },
description: String,
supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: false,
  },
user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
},
},
{ timestamps: true }
);


export default mongoose.model("Product", productSchema);