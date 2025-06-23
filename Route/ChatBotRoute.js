import express from "express";
import { handleUserChat } from "../Controller.js/ChatBotController.js";
import { requireSignIn } from "../middleware/UserMiddleware.js";

const router = express.Router();

// POST: /api/v1/chat
router.post("/chat-bot", requireSignIn, handleUserChat);

export default router;
