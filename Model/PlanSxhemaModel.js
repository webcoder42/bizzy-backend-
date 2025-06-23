import mongoose from "mongoose";
const planSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Plan ka naam jaise "Basic", "Premium"
  description: { type: String }, // Short description
  price: { type: Number, required: true }, // Plan price (e.g., 500 Rs)
  duration: { type: Number, required: true }, // Kitne din ka plan hai
  planType: {
    type: String,
    enum: ["free", "paid"],
    default: "paid",
  },
  planPurpose: {
    type: String,
    enum: ["billing", "team"], // Add more if needed
    required: true,
  },
  maxprojectPerDay: { type: Number, default: null }, // Roz ke max ads limit
  isActive: { type: Boolean, default: true }, // Active ya inactive plan
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("plans", planSchema);
