import express from 'express';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../controllers/notify/Notify';
import { authenticate } from '@/api/middlewares/auth/Authenticate';

const router = express.Router();

router.get('/', authenticate, getUserNotifications);
router.post('/mark-as-read/:notificationId', authenticate, markNotificationAsRead);
router.post('/mark-all-as-read', authenticate, markAllNotificationsAsRead);

export default router;
