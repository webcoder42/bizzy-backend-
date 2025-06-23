import mongoose from "mongoose";

const { Schema, model } = mongoose;

const teamHubSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  logo: String, // optional logo URL
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  members: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
      role: {
        type: String,
        enum: ["group-admin", "member"],
        default: "member",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  tasks: [
    {
      title: String,
      description: String,
      amount: Number,
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
      status: {
        type: String,
        enum: ["todo", "in_progress", "done"],
        default: "todo",
      },
      dueDate: Date,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      // ✅ New Submission Field
      submission: {
        submittedBy: {
          type: Schema.Types.ObjectId,
          ref: "users",
        },
        submittedAt: {
          type: Date,
        },
        note: String, // optional message
        file: String, // optional file proof URL or path
      },
    },
  ],

  chat: [
    {
      sender: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  activityLog: [
    {
      activity: String,
      user: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  settings: {
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowClientAccess: {
      type: Boolean,
      default: false,
    },
    allowMembersToChat: {
      // 👈 admin controls whether non-admins can send messages
      type: Boolean,
      default: true,
    },
    allowMembersToAssignTasks: {
      // 👈 optional: whether members can assign tasks
      type: Boolean,
      default: false,
    },
  },
  sharedFiles: [
    {
      name: String,
      type: {
        type: String,
        enum: ["file", "folder"],
        default: "file",
      },
      path: String, // Local path or cloud URL (e.g. S3, Firebase, etc.)
      uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TeamHub = model("TeamHub", teamHubSchema);
export default TeamHub;
