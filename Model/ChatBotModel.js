import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  message: { type: String, required: true },
  response: { type: String },
  userEmail: { type: String },
  username: { type: String },
  isFinancial: { type: Boolean, default: false },
  isKnowledgeBased: { type: Boolean, default: false },
  isActionable: { type: Boolean, default: false },
  isProposal: { type: Boolean, default: false },
  actions: [{
    type: { type: String, enum: ['link', 'button', 'email'] },
    label: { type: String },
    url: { type: String },
    description: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
});

// Add text search indexes
chatSchema.index({ message: 'text', response: 'text' });

export default mongoose.model("chat", chatSchema);
