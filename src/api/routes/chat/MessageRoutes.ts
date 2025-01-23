import { Router } from "express";
import { getMessagesUserWise, sendMessage, markMessageAsRead } from "@/api/controllers/chat/Message";

const router = Router();

router.post("/get-messages-user-wise", getMessagesUserWise);
router.post("/send-message", sendMessage);
router.post("/mark-as-read", markMessageAsRead);

export default router;
