import { WebSocketNotification } from '@/api/controllers/notifications/SocketNotificationController';
import express from 'express';

const router = express.Router();

// API to trigger notifications
router.post('/send',WebSocketNotification.sendNotification)
router.get('/get', WebSocketNotification.getNotification);
router.post('/mark-read', WebSocketNotification.markRead);
router.post('/mark-all-read', WebSocketNotification.markAllRead);
router.get('/get-count', WebSocketNotification.getNotificationCount);

export default router;
