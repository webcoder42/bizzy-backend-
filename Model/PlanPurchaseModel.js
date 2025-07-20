import mongoose from "mongoose";

const paymentDetailsSchema = new mongoose.Schema({
  paymentIntentId: { type: String },
  receiptUrl: { type: String },
  cardBrand: { type: String }, // Visa, MasterCard, etc.
  last4: { type: String }, // Last 4 digits of card
  country: { type: String }, // Billing country
  additionalDetails: { type: mongoose.Schema.Types.Mixed }, // Optional extra info
});

const planPurchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "plans",
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["card", "free"], // Only card
    default: "card",
  },
  paymentDetails: paymentDetailsSchema,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "expired"],
    default: "pending",
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("PlanPurchase", planPurchaseSchema);
