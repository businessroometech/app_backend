import { Router } from "express";
import { getMessagesUserWise, sendMessage, markMessageAsRead, getAllUnreadMessages, searchConnectionsByName } from "@/api/controllers/chat/Message";
import { authenticate } from "@/api/middlewares/auth/Authenticate";

const router = Router();

router.post("/get-messages-user-wise", authenticate, getMessagesUserWise);
router.post("/get-messages-unread", authenticate, getAllUnreadMessages);
router.post("/send-message", authenticate, sendMessage);
router.post("/mark-as-read", markMessageAsRead);
router.get("/search-connections-by-name", searchConnectionsByName);

export default router;
