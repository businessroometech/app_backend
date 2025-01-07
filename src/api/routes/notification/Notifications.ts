import express from "express";
import { createNotification, fetchNotifications, markAsRead } from "@/api/controllers/notifications/notificationController";
const router = express.Router();

router.post("/create",createNotification);
router.post("/mark-as-read", markAsRead);
router.post("/fetch", fetchNotifications);

export default router;
