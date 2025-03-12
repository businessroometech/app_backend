import { Notify, NotificationType } from "../../entity/notify/Notify";
import { Repository } from "typeorm";

// Import AppDataSource dynamically to avoid premature access
import { AppDataSource } from "../../../server";
import { Request, Response } from "express";

const getNotificationRepo = (): Repository<Notify> => {
    if (!AppDataSource.isInitialized) {
        throw new Error("Database not initialized yet");
    }
    return AppDataSource.getRepository(Notify);
};

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const createNotification = async (
    type: NotificationType,
    receiverId: string,
    senderId: string,
    message?: string,
    metaData?: Record<string, any>
): Promise<Notify> => {
    const notificationRepo = getNotificationRepo();

    const notification = notificationRepo.create({
        type,
        recieverId: receiverId,
        senderId,
        message,
        metaData,
        isRead: false,
        createdBy: 'system'
    });

    return await notificationRepo.save(notification);
};

export const getUserNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const notificationRepo = AppDataSource.getRepository(Notify);
        const notifications = await notificationRepo.find({
            where: { recieverId: userId },
            order: { createdAt: 'DESC' }
        });

        return res.status(200).json({ status: "success", data: { notifications } });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ status: "error", message: 'Internal server error' });
    }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { notificationId } = req.params;

        const notificationRepo = AppDataSource.getRepository(Notify);

        const notification = await notificationRepo.findOne({ where: { id: notificationId } });

        if (!notification) {
            return res.status(400).json({ status: "fail", message: 'Internal server error' });
        }

        notification.isRead = true;
        await notificationRepo.save(notification);

        return res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ status: "error", message: 'Internal server error' });
    }
};

export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;

        const notificationRepo = AppDataSource.getRepository(Notify);

        await notificationRepo
            .createQueryBuilder()
            .update(Notify)
            .set({ isRead: true })
            .where("recieverId = :userId AND isRead = false", { userId })
            .execute();

        return res.status(200).json({ status: "success", message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({ status: "error", message: 'Internal server error' });
    }
};
