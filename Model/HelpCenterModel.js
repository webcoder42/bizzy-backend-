import mongoose from "mongoose";
const { Schema } = mongoose;

// Generate unique ticket number (like TCK-202405311001)
function generateTicketNumber() {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-T:\.Z]/g, "")
    .slice(0, 12);
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `TCK-${timestamp}${random}`;
}

const helpCenterTicketSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ticketNumber: {
    type: String,
    unique: true,
    default: generateTicketNumber,
  },
  issueType: {
    type: String,
    enum: [
      "Cashout Delay",
      "Post Project Issue",
      "Fake Client",
      "Client Not Responding",
      "Other",
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "in progress", "resolved", "closed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically update updatedAt on update
helpCenterTicketSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("help-center-camplain", helpCenterTicketSchema);
