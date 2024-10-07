import { Notification } from "@/api/entity/notifications/Notification";
import { Template } from "@/api/entity/notifications/Template";
import { AppDataSource } from "@/server";
import { Request, Response } from "express";
import SMSService from "./SMSService";

class NotificationController {

    static replaceTemplateVariables(templateContent: string, data: Record<string, any>) {
        let content = templateContent;

        for (const key in data) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, data[key]);
        }

        return content;
    }

    static async sendNotification(req: Request, res: Response) {
        const { notificationType, templateName, recipientId, recipientType, data } = req.body;
        let notification: Notification | null = null;

        try {
            const templateRepository = AppDataSource.getRepository(Template);
            const template = await templateRepository.findOne({ where: { templateName } });

            if (!template) {
                console.error(`Template with name ${templateName} not found`);
                return res.status(400).json({ message: `Template with name ${templateName} not found` });
            }

            notification = new Notification();
            notification.templateId = template.id;
            notification.recipientId = recipientId;
            notification.recipientType = recipientType;
            notification.status = 'Pending';
            notification.isRead = false;
            notification.data = data;

            let result;
            try {
                switch (notificationType) {
                    case 'email':
                        notification.notificationType = 'email';
                        notification.status = 'Sent';
                        break;
                    case 'sms':
                        result = await SMSService.sendSMS(template.providerTemplateId, recipientId, recipientType, data);
                        notification.content = this.replaceTemplateVariables(template.templatePhoneContent, data);
                        notification.notificationType = 'sms';
                        notification.status = 'Sent';
                        break;
                    case 'inApp':
                        notification.content = this.replaceTemplateVariables(template.templateAppContent, data);
                        notification.notificationType = 'inApp';
                        notification.status = 'Sent';
                        break;
                    default:
                        notification.status = 'Failed';
                        console.error(`Invalid notification type: ${notificationType}`);
                        return res.status(400).json({ status: "error", message: 'Invalid notification type' });
                }
            } catch (notificationError) {
                console.error(`Failed to send ${notificationType} notification :`, notificationError);
                notification.status = 'Failed';
                return res.status(400).json({ status: "error", message: `Failed to send ${notificationType} notification` });
            }

            const notificationRepository = AppDataSource.getRepository(Notification);
            await notificationRepository.save(notification);

            return res.status(200).json({ status: "success", message: 'Notification sent successfully', data: { result } });

        } catch (error: any) {
            console.error('Error in sendNotification:', error);

            if (notification) {
                notification.status = 'Failed';
                try {
                    await AppDataSource.getRepository(Notification).save(notification);
                } catch (saveError) {
                    console.error('Failed to save notification status:', saveError);
                }
            }
            console.log("Error sending notifications :", error);
            return res.status(500).json({ status: "error", message: 'Failed to send notification' });
        }
    }

    static async fetchSentNotifications(req: Request, res: Response) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ status: "error", message: 'Recipient ID (userId) is required.' });
            }

            const notificationRepository = AppDataSource.getRepository(Notification);
            const notifications = await notificationRepository.find({
                where: {
                    recipientId: userId,
                    notificationType: 'inApp',
                    status: 'Sent'
                }
            });

            return res.status(200).json({ status: "success", message: "Fetched all notification for the user", data: { notifications } });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({ status: "error", message: 'Internal server error' });
        }
    }

    static async markAsRead(req: Request, res: Response) {
        try {
            const { notificationId } = req.body;

            if (!notificationId) {
                return res.status(400).json({ status: "error", message: 'Notification ID is required.' });
            }

            const notificationRepository = AppDataSource.getRepository(Notification);

            const notification = await notificationRepository.findOne({ where: { id: notificationId } });

            if (!notification) {
                return res.status(400).json({ status: "error", message: 'Notification not found.' });
            }

            notification.isRead = true;
            await notificationRepository.save(notification);

            return res.status(200).json({ status: "success", message: 'Notification marked as read.', data: { notification } });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return res.status(500).json({ status: "error", message: 'Internal server error.' });
        }
    }
}


export default NotificationController;