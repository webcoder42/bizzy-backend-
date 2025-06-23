import express from "express";
import { requireSignIn } from "./../middleware/UserMiddleware.js";
import {
  addMemberByEmail,
  checkUserTeamStatus,
  createTeam,
  getAllTeamMembers,
  getAllTeamMessages,
  getTeamSettings,
  getTeamTasks,
  sendTeamMessage,
  updateTeamSettings,
  uploadTaskToTeam,
  updateTaskStatus,
  kickMember,
  deleteTeam,
  leaveTeam,
} from "../Controller.js/TeamHubController.js";

const router = express.Router();

router.post("/create", requireSignIn, createTeam);

router.get("/check-status", requireSignIn, checkUserTeamStatus);

router.post("/add-by-email", requireSignIn, addMemberByEmail);
router.get("/members", requireSignIn, getAllTeamMembers);

router.put("/team-settings", requireSignIn, updateTeamSettings);

router.post("/team-send-message", requireSignIn, sendTeamMessage);

router.get("/team-settings", requireSignIn, getTeamSettings);
router.get("/team-chat", requireSignIn, getAllTeamMessages);

router.post("/task-upload", requireSignIn, uploadTaskToTeam);
router.get("/team/tasks", requireSignIn, getTeamTasks);
router.put("/task/status", requireSignIn, updateTaskStatus);

router.post("/kick-member", requireSignIn, kickMember);

router.delete("/delete-team", requireSignIn, deleteTeam);

router.delete("/leave-team", requireSignIn, leaveTeam);

export default router;
