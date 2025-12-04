import mongoose from "mongoose";


const clientSchema = new mongoose.Schema(
{
name: { type: String, required: true, trim: true },
phone: String,
email: String,
address: String,
balance: { type: Number, default: 0 },
user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
},
},
{ timestamps: true }
);


export default mongoose.model("Client", clientSchema);