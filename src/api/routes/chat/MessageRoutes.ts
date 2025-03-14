import { Router } from "express";
import { getMessagesUserWise, sendMessage, markMessageAsRead, getAllUnreadMessages, searchConnectionsByName, getMessageHistory } from "@/api/controllers/chat/Message";
import { authenticate } from "@/api/middlewares/auth/Authenticate";

const router = Router();

router.post("/get-messages-user-wise", authenticate, getMessagesUserWise);
router.get("/get-messages-unread", authenticate, getAllUnreadMessages);
router.post("/send-message", authenticate, sendMessage);
router.post("/mark-as-read", authenticate, markMessageAsRead);
router.get("/search-connections-by-name", authenticate, searchConnectionsByName);
router.get("/message-history", authenticate, getMessageHistory);

export default router;
