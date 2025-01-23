import { WebSocketNotification } from '@/api/controllers/notifications/SocketNotificationController';
import express, { Request, Response } from 'express';

const router = express.Router();

// API to trigger notifications
router.post('/send',WebSocketNotification.sendNotification)
router.get('/get', WebSocketNotification.getNotification);

export default router;
