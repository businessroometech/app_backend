import { Request, Response } from "express";
import { AppDataSource } from "@/server";
import { Notifications } from "@/api/entity/notifications/Notifications";
import { UserLogin } from "@/api/entity/user/UserLogin";


export const createNotification = async (req: Request, res: Response) => {
    const { userId, message, navigation } = req.body;
  
    // Validate required fields
    if (!userId || !message || !navigation) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, message, or navigation.",
      });
    }
  
    try {
      const userRepos = AppDataSource.getRepository(UserLogin);
  
      // Check if user exists
      const user = await userRepos.findOneBy({ id: userId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User ID is invalid or does not exist.",
        });
      }
  
      // Use the Notifications repository to create the notification
      const notificationRepos = AppDataSource.getRepository(Notifications);
      const notification = notificationRepos.create({
        userId,
        message,
        navigation,
      });
  
      // Save the notification
      await notificationRepos.save(notification);
  
      return res.status(201).json({
        success: true,
        notification,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

export const markAsRead = async (req: Request, res: Response) => {
  const { notificationId } = req.body;

  try {
    const notificationRepository = AppDataSource.getRepository(Notifications);
    const notification = await notificationRepository.findOneBy({ id : notificationId});
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    notification.isRead = true;
    await notification.save();
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const fetchNotifications = async (req: Request, res: Response) => {
  const { userId } = req.body;
  try {
    const notificationRepository = AppDataSource.getRepository(Notifications);
    const notifications = await notificationRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
