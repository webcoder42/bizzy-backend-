import express from "express";
import { requireSignIn, isAdmin } from "../middleware/UserMiddleware.js";
import {
  getAdminDashboardStats,
  getAllUserChats,
  getAllChatBotInteractions,
  getAllWorkSubmissions,
  getAllProjectRatings,
  getAllCompletedProjects,
  getAllHiredProjects,
  getAllWorkspaces,
  getActivityTimeline,
  getUserAnalytics,
} from "../Controller.js/AdminAnalyticsController.js";

const router = express.Router();

// Admin dashboard overview stats
router.get("/dashboard-stats", requireSignIn, isAdmin, getAdminDashboardStats);

// Get all user chats and messages
router.get("/user-chats", requireSignIn, isAdmin, getAllUserChats);

// Get all chatbot interactions
router.get("/chatbot-interactions", requireSignIn, isAdmin, getAllChatBotInteractions);

// Get all work submissions
router.get("/work-submissions", requireSignIn, isAdmin, getAllWorkSubmissions);

// Get all project ratings and reviews
router.get("/project-ratings", requireSignIn, isAdmin, getAllProjectRatings);

// Get all completed projects
router.get("/completed-projects", requireSignIn, isAdmin, getAllCompletedProjects);

// Get all hired projects
router.get("/hired-projects", requireSignIn, isAdmin, getAllHiredProjects);

// Get all workspaces
router.get("/workspaces", requireSignIn, isAdmin, getAllWorkspaces);

// Get activity timeline
router.get("/activity-timeline", requireSignIn, isAdmin, getActivityTimeline);

// Get specific user analytics
router.get("/user-analytics/:userId", requireSignIn, isAdmin, getUserAnalytics);

export default router;