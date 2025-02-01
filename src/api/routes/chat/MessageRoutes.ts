import { Router } from "express";
import { getMessagesUserWise, sendMessage, markMessageAsRead, getAllUnreadMessages } from "@/api/controllers/chat/Message";

const router = Router();

router.post("/get-messages-user-wise", getMessagesUserWise);
router.post("/get-messages-unread", getAllUnreadMessages);
router.post("/send-message", sendMessage);
router.post("/mark-as-read", markMessageAsRead);

export default router;
