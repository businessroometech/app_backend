import { Notify, NotificationType } from "../../entity/notify/Notify";
import { Repository } from "typeorm";

// Import AppDataSource dynamically to avoid premature access
import { AppDataSource } from "../../../server";

const getNotificationRepo = (): Repository<Notify> => {
    if (!AppDataSource.isInitialized) {
        throw new Error("Database not initialized yet");
    }
    return AppDataSource.getRepository(Notify);
};

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
