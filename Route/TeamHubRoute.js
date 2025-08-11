import express from "express";
import { 
  createTeam, 
  getUserTeams, 
  updateTeam, 
  deleteTeam, 
  getTeamById,
  sendChatMessage,
  addUserToTeam,
  removeUserFromTeam,
  promoteUserToAdmin,
  demoteUserFromAdmin,
  getTeamTasks,
  createTeamTask,
  updateTeamTask,
  updateTeamSettings,
  leaveTeam
} from "../Controller.js/TeamHubController.js";
import { requireSignIn } from "../middleware/UserMiddleware.js";

const router = express.Router();

router.post("/create", requireSignIn, createTeam);
router.get("/my-teams", requireSignIn, getUserTeams);
router.get("/team/:teamId", requireSignIn, getTeamById);
router.put("/update/:teamId", requireSignIn, updateTeam);
router.delete("/delete/:teamId", requireSignIn, deleteTeam);

router.post("/team/:teamId/chat", requireSignIn, sendChatMessage);
router.post("/team/:teamId/add-user", requireSignIn, addUserToTeam);
router.delete("/team/:teamId/remove-user/:userId", requireSignIn, removeUserFromTeam);
router.put("/team/:teamId/promote-user/:userId", requireSignIn, promoteUserToAdmin);
router.put("/team/:teamId/demote-user/:userId", requireSignIn, demoteUserFromAdmin);

router.get("/team/:teamId/tasks", requireSignIn, getTeamTasks);
router.post("/team/:teamId/tasks", requireSignIn, createTeamTask);
router.put("/team/:teamId/tasks/:taskId", requireSignIn, updateTeamTask);
router.put("/team/:teamId/settings", requireSignIn, updateTeamSettings);
router.post("/team/:teamId/leave", requireSignIn, leaveTeam);

export default router;
