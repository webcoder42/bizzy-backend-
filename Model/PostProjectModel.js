import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: [
      "Web Development",
      "Mobile App Development",
      "Graphic Design",
      "Content Writing",
      "SEO",
      "Digital Marketing",
      "Data Science",
      "Virtual Assistant",
      "Translation",
      "Video Editing",
      "UX/UI Design",
      "Social Media Management",
      "Customer Support",
      "Software Development",
      "QA Testing",
      "Business Consulting",
      "Artificial Intelligence",
      "Machine Learning",
      "Deep Learning",
    ],
    required: true,
  },
  skillsRequired: [
    {
      type: String,
      enum: [
        "JavaScript",
        "Python",
        "PHP",
        "React",
        "Node.js",
        "Vue.js",
        "Angular",
        "React Native",
        "Flutter",
        "Swift",
        "Java",
        "Kotlin",
        "HTML",
        "CSS",
        "WordPress",
        "Shopify",
        "SEO",
        "Content Writing",
        "Copywriting",
        "Graphic Design",
        "Adobe Photoshop",
        "Illustrator",
        "After Effects",
        "Video Editing",
        "Social Media Marketing",
        "Google Ads",
        "Facebook Ads",
        "Data Analysis",
        "Machine Learning",
        "AI",
        "Sales",
        "Customer Support",
        "UX/UI Design",
        "DevOps",
        "Cybersecurity",
        "Blockchain",
        "MERN Stack",
        "Data Science",
        "Game Development",
        "3D Modeling",
        "Motion Graphics",
        "Virtual Assistant",
        "Translation",
        "Voice Over",
        "Accounting & Finance",
        "Legal Consulting",
      ],
      required: true,
    },
  ],

  // Template fields for structured project requirements
  projectRequirements: {
    projectOverview: {
      type: String,
      required: true,
      trim: true,
    },
    specificFeatures: {
      type: String,
      required: true,
      trim: true,
    },
    technicalRequirements: {
      type: String,
      required: true,
      trim: true,
    },
    designPreferences: {
      type: String,
      required: true,
      trim: true,
    },
    targetAudience: {
      type: String,
      required: true,
      trim: true,
    },
    competitors: {
      type: String,
      required: true,
      trim: true,
    },
    timeline: {
      type: String,
      required: true,
      trim: true,
    },
    budgetBreakdown: {
      type: String,
      required: true,
      trim: true,
    },
    deliverables: {
      type: String,
      required: true,
      trim: true,
    },
    successMetrics: {
      type: String,
      required: true,
      trim: true,
    },
  },

  // Experience and problem fields
  clientExperience: {
    type: String,
    required: true,
    trim: true,
  },
  problemsFaced: {
    type: String,
    required: true,
    trim: true,
  },
  expectedOutcome: {
    type: String,
    required: true,
    trim: true,
  },

  status: {
    type: String,
    enum: ["open", "In-progress", "completed", "cancelled"],
    default: "open",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ClientPostProject", jobSchema);
