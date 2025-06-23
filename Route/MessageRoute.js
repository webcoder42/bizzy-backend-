// =================== clientRoutes.js ===================
import express from "express";
import { requireSignIn } from "../middleware/UserMiddleware.js";
import {
  clientSendMessage,
  getChatWithUser,
  getMessageHistoryBySenderGrouped,
  getMessagesReceivedByUser,
  getSendersToUser,
  replyToUser,
  markMessagesAsRead,
  getUnreadMessages,
  getMessageHistoryWithUser,
} from "../Controller.js/MessageController.js";

const router = express.Router();

router.post("/client-send", requireSignIn, clientSendMessage);
router.get("/history/grouped", requireSignIn, getMessageHistoryBySenderGrouped);
router.get("/history/:userId", requireSignIn, getMessageHistoryWithUser);

router.get("/messages/received", requireSignIn, getMessagesReceivedByUser); // Controller 1
router.get("/chat/:otherUserId", requireSignIn, getChatWithUser); // Controller 2
router.post("/chat/reply", requireSignIn, replyToUser);
router.get("/inbox", requireSignIn, getSendersToUser);
router.put("/read/:senderId", requireSignIn, markMessagesAsRead);
router.get("/unread", requireSignIn, getUnreadMessages);

export default router;
