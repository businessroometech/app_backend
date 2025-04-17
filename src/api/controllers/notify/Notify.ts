import { Notify, NotificationType } from '../../entity/notify/Notify';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';
import { Repository } from 'typeorm';

import { AppDataSource } from '../../../server';
import { Request, Response } from 'express';
import { generatePresignedUrl } from '../s3/awsControllers';
import { getSocketInstance } from '@/socket';
import { Message } from '@/api/entity/chat/Message';
import { MessageHistory } from '@/api/entity/chat/MessageHistory';

const getNotificationRepo = (): Repository<Notify> => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized yet');
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
    createdBy: 'system',
  });

  return await notificationRepo.save(notification);
};

export const getUserNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const notificationRepo = AppDataSource.getRepository(Notify);
    const userRepo = AppDataSource.getRepository(PersonalDetails);

    const notification = await notificationRepo.find({
      where: { recieverId: userId },
      order: { createdAt: 'DESC' },
    });

    const notif = await notificationRepo.find({ where: { recieverId: userId, isRead: false } });

    const [notifications, notify] = activeUserNotification(notification, notif);

    const formattedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let imageUrl = null;

        if (notification.metaData?.imageKey) {
          imageUrl = await generatePresignedUrl(notification?.metaData?.imageKey);
        }

        return {
          ...notification,
          metaData: {
            ...notification.metaData,
            imageUrl,
          },
          isReadCount: notify.length,
        };
      })
    );

    function activeUserNotification(notifcation: Notify[], notif: Notify[]): Notify[][] {
      const notifcations = notifcation.filter(async (notf) => {
        const isActive = await userRepo.findOne({
          where: {
            id: notf.senderId,
            active: 1,
          },
        });
        return isActive;
      });

      const notify = notif.filter(async (notf) => {
        const isActive = await userRepo.findOne({
          where: {
            id: notf.senderId,
            active: 1,
          },
        });
        return isActive;
      });

      return [notifcations, notify];
    }

    return res.status(200).json({ status: 'success', data: { notifications: formattedNotifications } });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notificationId } = req.params;

    const userId = req.userId;

    const notificationRepo = AppDataSource.getRepository(Notify);

    const notification = await notificationRepo.findOne({ where: { id: notificationId } });

    if (!notification) {
      return res.status(400).json({ status: 'fail', message: 'Internal server error' });
    }

    notification.isRead = true;
    await notificationRepo.save(notification);

    const NotifyRepo = AppDataSource.getRepository(Notify);
    const [notifcation, notifyCount] = await NotifyRepo.findAndCount({ where: { recieverId: userId, isRead: false } });

    const messageRepo = AppDataSource.getRepository(Message);
    const messageHistoryRepo = AppDataSource.getRepository(MessageHistory);

    const history = await messageHistoryRepo.find({
      where: [{ senderId: userId }, { receiverId: userId }],
    });

    const unreadMessagesCount = (
      await Promise.all(
        (history || []).map(async (his) => {
          let myId = his.receiverId === userId ? his.receiverId : his.senderId;
          let otherId = his.receiverId === userId ? his.senderId : his.receiverId;

          const count = await messageRepo.count({
            where: { receiverId: myId, senderId: otherId, isRead: false },
          });

          return count > 0 ? { senderId: otherId, receiverId: myId, unReadCount: count } : null;
        })
      )
    ).filter((item) => item !== null);

    const io = getSocketInstance();
    io.to(userId!).emit('initialize', {
      userId,
      welcomeMessage: 'Welcome to BusinessRoom!',
      unreadNotificationsCount: notifyCount ? notifyCount : 0,
      unreadMessagesCount: unreadMessagesCount ? unreadMessagesCount.length : 0,
    });

    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
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
      .where('recieverId = :userId AND isRead = false', { userId })
      .execute();

    const NotifyRepo = AppDataSource.getRepository(Notify);
    const [notifcation, notifyCount] = await NotifyRepo.findAndCount({ where: { recieverId: userId, isRead: false } });

    const messageRepo = AppDataSource.getRepository(Message);
    const messageHistoryRepo = AppDataSource.getRepository(MessageHistory);

    const history = await messageHistoryRepo.find({
      where: [{ senderId: userId }, { receiverId: userId }],
    });

    const unreadMessagesCount = (
      await Promise.all(
        (history || []).map(async (his) => {
          let myId = his.receiverId === userId ? his.receiverId : his.senderId;
          let otherId = his.receiverId === userId ? his.senderId : his.receiverId;

          const count = await messageRepo.count({
            where: { receiverId: myId, senderId: otherId, isRead: false },
          });

          return count > 0 ? { senderId: otherId, receiverId: myId, unReadCount: count } : null;
        })
      )
    ).filter((item) => item !== null);

    const io = getSocketInstance();
    io.to(userId!).emit('initialize', {
      userId,
      welcomeMessage: 'Welcome to BusinessRoom!',
      unreadNotificationsCount: notifyCount ? notifyCount : 0,
      unreadMessagesCount: unreadMessagesCount ? unreadMessagesCount.length : 0,
    });

    return res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
