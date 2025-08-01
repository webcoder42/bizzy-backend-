import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: String,
      required: true,
      trim: true,
    },
    problems: {
      type: String,
      required: true,
      trim: true,
    },
    bonus: {
      type: String,
      required: false,
      trim: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX Design",
        "Graphic Design",
        "Content Writing",
        "Digital Marketing",
        "Data Science",
        "AI/ML",
        "Blockchain",
        "Game Development",
        "Other",
      ],
    },
    skillsRequired: {
      type: [String],
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "completed", "cancelled"],
      default: "open",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ClientPostProject", jobSchema);
