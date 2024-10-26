import express from 'express';

import notificationController from '@/api/controllers/notifications/Notification';
import { createTemplates } from "@/api/controllers/notifications/Template";

const Router = express.Router();

Router.post('/', notificationController.sendNotification);
Router.post('/your-notifications', notificationController.fetchSentNotifications);
Router.post('/your-notifications/mark-as-read', notificationController.markAsRead);

Router.post('/add-templates', createTemplates);

export default Router;