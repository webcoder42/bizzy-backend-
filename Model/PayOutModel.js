import mongoose from "mongoose";

// Tax detail for user
const taxDetailsSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    taxIdentificationNumber: { type: String, required: true }, // e.g., NTN
    country: { type: String, required: true },
    taxDocumentUrl: { type: String }, // Optional proof
  },
  { _id: false }
); // Embedded, no own _id
// Payout account (like Payoneer or Manual/Auto setup)
const payoutAccountSchema = new mongoose.Schema(
  {
    withdrawalMethod: {
      type: String,
      enum: ["manual", "auto"],
      default: "manual",
    },
    payoneer: {
      bankName: { type: String, default: "First Century Bank" },
      accountHolderName: { type: String },
      accountNumber: { type: String },
      routingNumber: { type: String },
      swiftCode: { type: String },
      country: { type: String },
      currency: { type: String, default: "USD" },
      bankAddress: { type: String },
    },
  },
  { _id: false }
); // Embedded object

// Withdrawal history entry
const withdrawalEntrySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "rejected"],
      default: "pending",
    },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    accountIndex: { type: Number, required: true },
    accountDetails: { type: payoutAccountSchema, required: true },
    transactionId: { type: String }, // For tracking the actual transfer
    notes: { type: String }, // Admin notes
  },
  { _id: true }
);

// Main Withdrawal Schema
const userWithdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    taxDetails: [taxDetailsSchema], // List of submitted tax records
    payoutAccounts: [payoutAccountSchema], // List of added payout accounts
    withdrawals: [withdrawalEntrySchema], // List of withdrawal history
  },
  { timestamps: true }
);

export default mongoose.model("WithdrawalRequest", userWithdrawalSchema);
