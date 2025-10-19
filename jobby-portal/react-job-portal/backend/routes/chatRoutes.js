import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getOrCreateConversation,
  sendMessage,
  listConversations,
  getMessages,
  markConversationRead,
  getUnreadCount,
} from "../controllers/chatController.js";

const router = express.Router();

// Protect all chat routes with your middleware
router.post("/conversation", isAuthenticated, getOrCreateConversation);
router.get("/conversations", isAuthenticated, listConversations);
router.get("/conversations/unread-count", isAuthenticated, getUnreadCount);
router.post("/message", isAuthenticated, sendMessage);
router.get("/messages/:conversationId", isAuthenticated, getMessages);
router.post("/conversations/:conversationId/mark-read", isAuthenticated, markConversationRead);

export default router;