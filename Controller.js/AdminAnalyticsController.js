import UserModel from "../Model/UserModel.js";
import MessageModel from "../Model/MessageModel.js";
import ChatBotModel from "../Model/ChatBotModel.js";
import SubmitProjectModel from "../Model/SubmitProjectModel.js";
import PostProjectModel from "../Model/PostProjectModel.js";
import ProjectApplyModel from "../Model/ProjectApplyModel.js";
import TeamHubModel from "../Model/TeamHubModel.js";
import PlanPurchaseModel from "../Model/PlanPurchaseModel.js";
import PayOutModel from "../Model/PayOutModel.js";

export const getAdminDashboardStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const [
      totalUsers,
      totalProjects,
      totalSubmissions,
      totalMessages,
      totalChatBotMessages,
      totalWorkspaces,
      completedProjects,
      activeUsers,
      recentRegistrations,
    ] = await Promise.all([
      UserModel.countDocuments(),
      PostProjectModel.countDocuments(),
      SubmitProjectModel.countDocuments(),
      MessageModel.countDocuments(),
      ChatBotModel.countDocuments(),
      TeamHubModel.countDocuments(),
      SubmitProjectModel.countDocuments({ status: "approved" }),
      UserModel.countDocuments({ availability: { $in: ["online", "busy"] } }),
      UserModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const totalEarnings = await UserModel.aggregate([
      { $unwind: "$EarningLogs" },
      { $group: { _id: null, total: { $sum: "$EarningLogs.amount" } } },
    ]);

    const totalRevenue = await PlanPurchaseModel.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProjects,
          totalSubmissions,
          totalMessages,
          totalChatBotMessages,
          totalWorkspaces,
          completedProjects,
          activeUsers,
          recentRegistrations,
          totalEarnings: totalEarnings[0]?.total || 0,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error getting admin dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllUserChats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { page = 1, limit = 50, userId, startDate, endDate } = req.query;

    let query = {};
    if (userId) query.$or = [{ sender: userId }, { receiver: userId }];
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const messages = await MessageModel.find(query)
      .populate("sender", "Fullname username email")
      .populate("receiver", "Fullname username email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MessageModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
      },
    });
  } catch (error) {
    console.error("Error getting user chats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllChatBotInteractions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { page = 1, limit = 50, userId, startDate, endDate } = req.query;

    let query = {};
    if (userId) query.userId = userId;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const chats = await ChatBotModel.find(query)
      .populate("userId", "Fullname username email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ChatBotModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: chats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalChats: total,
      },
    });
  } catch (error) {
    console.error("Error getting chatbot interactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllWorkSubmissions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { page = 1, limit = 50, status, userId, projectId, startDate, endDate } = req.query;

    let query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (projectId) query.project = projectId;
    if (startDate && endDate) {
      query.submittedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const submissions = await SubmitProjectModel.find(query)
      .populate({
        path: "user",
        select: "Fullname username email"
      })
      .populate({
        path: "project",
        select: "title budget client status createdAt",
        populate: {
          path: "client",
          select: "Fullname username email"
        }
      })
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SubmitProjectModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSubmissions: total,
      },
    });
  } catch (error) {
    console.error("Error getting work submissions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllProjectRatings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { page = 1, limit = 50, rating, experience, userId, startDate, endDate } = req.query;

    let query = { "review.rating": { $exists: true } };
    if (rating) query["review.rating"] = parseInt(rating);
    if (experience) query["review.experience"] = experience;
    if (userId) query.user = userId;
    if (startDate && endDate) {
      query["review.createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const ratings = await SubmitProjectModel.find(query)
      .populate("user", "Fullname username email")
      .populate("project", "title budget client")
      .populate("project.client", "Fullname email")
      .sort({ "review.createdAt": -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SubmitProjectModel.countDocuments(query);

    const ratingStats = await SubmitProjectModel.aggregate([
      { $match: { "review.rating": { $exists: true } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$review.rating" },
          totalRatings: { $sum: 1 },
          ratingBreakdown: {
            $push: "$review.rating",
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: ratings,
      stats: ratingStats[0] || { averageRating: 0, totalRatings: 0 },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRatings: total,
      },
    });
  } catch (error) {
    console.error("Error getting project ratings:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllCompletedProjects = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { page = 1, limit = 50, userId, clientId, startDate, endDate } = req.query;

    let query = { status: "completed" };
    if (userId || clientId) {
      if (userId) query.client = userId;
      if (clientId) query.client = clientId;
    }
    if (startDate && endDate) {
      query.updatedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const projects = await PostProjectModel.find(query)
      .populate({
        path: "client",
        select: "Fullname username email"
      })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PostProjectModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProjects: total,
      },
    });
  } catch (error) {
    console.error("Error getting completed projects:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all hired projects (projects with applied candidates)
export const getAllHiredProjects = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { page = 1, limit = 50, userId, clientId, startDate, endDate } = req.query;

    let query = { status: "hired" };
    if (userId || clientId) {
      if (userId) query.client = userId;
      if (clientId) query.client = clientId;
    }
    if (startDate && endDate) {
      query.updatedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get projects with their hired freelancers
    const projects = await PostProjectModel.find(query)
      .populate({
        path: "client",
        select: "Fullname username email"
      })
      .populate({
        path: "hiredFreelancer",
        select: "Fullname username email"
      })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Also get projects from ProjectApply model where status is hired
    const hiredApplications = await ProjectApplyModel.find({ status: "hired" })
      .populate({
        path: "user",
        select: "Fullname username email"
      })
      .populate({
        path: "project",
        select: "title budget client status createdAt updatedAt",
        populate: {
          path: "client",
          select: "Fullname username email"
        }
      })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PostProjectModel.countDocuments(query);
    const totalHiredApplications = await ProjectApplyModel.countDocuments({ status: "hired" });

    return res.status(200).json({
      success: true,
      data: {
        hiredProjects: projects,
        hiredApplications: hiredApplications
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((total + totalHiredApplications) / limit),
        totalProjects: total + totalHiredApplications,
      },
    });
  } catch (error) {
    console.error("Error getting hired projects:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllWorkspaces = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { page = 1, limit = 50, createdBy, startDate, endDate } = req.query;

    let query = {};
    if (createdBy) query.createdBy = createdBy;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const workspaces = await TeamHubModel.find(query)
      .populate("createdBy", "Fullname username email")
      .populate("members.user", "Fullname username email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TeamHubModel.countDocuments(query);

    const workspaceStats = await TeamHubModel.aggregate([
      {
        $group: {
          _id: null,
          totalMembers: { $sum: { $size: "$members" } },
          averageMembers: { $avg: { $size: "$members" } },
          totalTasks: { $sum: { $size: "$tasks" } },
          totalMessages: { $sum: { $size: "$chat" } },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: workspaces,
      stats: workspaceStats[0] || {},
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalWorkspaces: total,
      },
    });
  } catch (error) {
    console.error("Error getting workspaces:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getActivityTimeline = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { limit = 100, startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.$gte = new Date(startDate);
      dateFilter.$lte = new Date(endDate);
    }

    const activities = [];

    const [
      recentUsers,
      recentMessages,
      recentSubmissions,
      recentProjects,
      recentRatings,
    ] = await Promise.all([
      UserModel.find(dateFilter.createdAt ? { createdAt: dateFilter } : {})
        .select("Fullname username createdAt")
        .sort({ createdAt: -1 })
        .limit(20),
      MessageModel.find(dateFilter.createdAt ? { createdAt: dateFilter } : {})
        .populate("sender", "Fullname username")
        .populate("receiver", "Fullname username")
        .sort({ createdAt: -1 })
        .limit(20),
      SubmitProjectModel.find(dateFilter.submittedAt ? { submittedAt: dateFilter } : {})
        .populate("user", "Fullname username")
        .populate("project", "title")
        .sort({ submittedAt: -1 })
        .limit(20),
      PostProjectModel.find(dateFilter.createdAt ? { createdAt: dateFilter } : {})
        .populate("client", "Fullname username")
        .sort({ createdAt: -1 })
        .limit(20),
      SubmitProjectModel.find({
        "review.createdAt": dateFilter["review.createdAt"] || { $exists: true },
      })
        .populate("user", "Fullname username")
        .populate("project", "title")
        .sort({ "review.createdAt": -1 })
        .limit(20),
    ]);

    recentUsers.forEach(user => {
      activities.push({
        type: "user_registration",
        timestamp: user.createdAt,
        user: user.Fullname,
        description: `${user.Fullname} (@${user.username}) registered`,
      });
    });

    recentMessages.forEach(message => {
      activities.push({
        type: "message",
        timestamp: message.createdAt,
        user: message.sender?.Fullname,
        description: `${message.sender?.Fullname} sent message to ${message.receiver?.Fullname}`,
      });
    });

    recentSubmissions.forEach(submission => {
      activities.push({
        type: "work_submission",
        timestamp: submission.submittedAt,
        user: submission.user?.Fullname,
        description: `${submission.user?.Fullname} submitted work for "${submission.project?.title}"`,
        status: submission.status,
      });
    });

    recentProjects.forEach(project => {
      activities.push({
        type: "project_posted",
        timestamp: project.createdAt,
        user: project.client?.Fullname,
        description: `${project.client?.Fullname} posted project "${project.title}"`,
      });
    });

    recentRatings.forEach(rating => {
      if (rating.review) {
        activities.push({
          type: "project_rating",
          timestamp: rating.review.createdAt,
          user: rating.user?.Fullname,
          description: `${rating.user?.Fullname} received ${rating.review.rating}⭐ rating for "${rating.project?.title}"`,
          rating: rating.review.rating,
        });
      }
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({
      success: true,
      data: activities.slice(0, limit),
    });
  } catch (error) {
    console.error("Error getting activity timeline:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getUserAnalytics = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { userId } = req.params;

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [
      messagesSent,
      messagesReceived,
      projectsPosted,
      workSubmissions,
      ratingsReceived,
      workspacesCreated,
      workspacesMember,
      chatBotInteractions,
    ] = await Promise.all([
      MessageModel.countDocuments({ sender: userId }),
      MessageModel.countDocuments({ receiver: userId }),
      PostProjectModel.countDocuments({ client: userId }),
      SubmitProjectModel.countDocuments({ user: userId }),
      SubmitProjectModel.countDocuments({ user: userId, "review.rating": { $exists: true } }),
      TeamHubModel.countDocuments({ createdBy: userId }),
      TeamHubModel.countDocuments({ "members.user": userId }),
      ChatBotModel.countDocuments({ userId: userId }),
    ]);

    const recentActivity = await Promise.all([
      MessageModel.find({ $or: [{ sender: userId }, { receiver: userId }] })
        .populate("sender receiver", "Fullname username")
        .sort({ createdAt: -1 })
        .limit(10),
      SubmitProjectModel.find({ user: userId })
        .populate("project", "title")
        .sort({ submittedAt: -1 })
        .limit(10),
      PostProjectModel.find({ client: userId })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          messagesSent,
          messagesReceived,
          projectsPosted,
          workSubmissions,
          ratingsReceived,
          workspacesCreated,
          workspacesMember,
          chatBotInteractions,
        },
        recentActivity: {
          messages: recentActivity[0],
          submissions: recentActivity[1],
          projects: recentActivity[2],
        },
      },
    });
  } catch (error) {
    console.error("Error getting user analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};