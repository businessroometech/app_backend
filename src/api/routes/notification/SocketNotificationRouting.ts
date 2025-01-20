import { SocketNotification } from '@/api/controllers/notifications/SocketNotificationController';
import express, { Request, Response } from 'express';

const router = express.Router();

// API to trigger notifications
router.post('/send',SocketNotification.sendNotification)
router.get('/get', SocketNotification.getNotification);

export default router;
