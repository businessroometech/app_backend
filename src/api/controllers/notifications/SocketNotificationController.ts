import { Notifications } from '@/api/entity/notifications/Notifications';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { AppDataSource } from '@/server';
// import WebSocket, { WebSocketServer } from 'ws';

import { getSocketInstance } from '../../../socket';
import { Request, Response } from 'express';
import { generatePresignedUrl } from '../s3/awsControllers';
import { formatTimestamp } from '../UserPost';

export class WebSocketNotification {
  //   private static wss: WebSocketServer;
  //   private static clients: Map<string, WebSocket> = new Map();

  //   // Initialize WebSocket server
  //   public static initialize(port: number) {
  //     this.wss = new WebSocketServer({ port });
  //     console.log(`WebSocket server initialized on port ${port}`);

  //     this.wss.on('connection', (ws: WebSocket) => {
  //       console.log('New client connected.');

  //       ws.on('message', (data) => {
  //         try {
  //           const parsedData = JSON.parse(data.toString());
  //           if (parsedData.type === 'join') {
  //             const { userId } = parsedData;
  //             console.log(`User joined: ${userId}`);
  //             this.clients.set(userId, ws);
  //           }
  //         } catch (err) {
  //           console.error('Error parsing WebSocket message:', err);
  //         }
  //       });

  //       ws.on('close', () => {
  //         console.log('Client disconnected.');
  //         this.removeClient(ws);
  //       });

  //       // Welcome message for new connections
  //       ws.send(JSON.stringify({ message: 'Welcome to WebSocket notifications!' }));
  //     });
  //   }

  //   private static removeClient(ws: WebSocket) {
  //     for (const [userId, client] of this.clients.entries()) {
  //       if (client === ws) {
  //         this.clients.delete(userId);
  //         break;
  //       }
  //     }
  //   }
//  notification count 
  public static getNotificationCount = async (req: Request, res: Response) => {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      
      const notificationRepo = AppDataSource.getRepository(Notifications);

      // Find unread notifications for the user
      const unreadCount = await notificationRepo.count({
        where: {
          userId: String(userId),
          isRead: false,
        },
      });
      return res.status(200).json({
        success: true,
        unreadCount,
      });
    } catch (error) {
      console.error('Error retrieving notification count:', error);
      return res.status(500).json({ error: 'Error retrieving notification count' });
    }
  };

  // Send notification to a specific user
  public static sendNotification = async (req: Request, res: Response) => {
    const { userId, message, mediaUrl } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    try {
      const userRepos = AppDataSource.getRepository(PersonalDetails);
      const user = await userRepos.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User ID is invalid or does not exist.' });
      }

      // Create a new notification
      const notificationRepo = AppDataSource.getRepository(Notifications);
      const notification = notificationRepo.create({
        userId,
        message,
        mediaUrl: mediaUrl || "",
        createdBy: "Live",
      });

      // Send notification via WebSocket
      const io = getSocketInstance();
      const noticeInfo = io.to(userId).emit("notifications", { message, mediaUrl });

      if (noticeInfo) {
        await notificationRepo.save(notification); 
        return res.status(200).json({ success: true, message: "Notification sent successfully" });
      }
      
    } catch (error) {
      console.error('Error sending notification:', error);
      return res.status(500).json({ error: 'Error sending notification' });
    }
  };

  // Get notifications for a specific user
  public static async getNotification(req: Request, res: Response): Promise<Response> {
    const { userId } = req.query;
  
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
  
    try {
      const notificationRepo =  AppDataSource.getRepository(Notifications)
      const notifications = await notificationRepo.find({ where: { userId: String(userId) },
        order: { createdAt: 'DESC' },});
  
      // Format timestamps before sending response
      const formattedNotifications = await Promise.all(notifications.map(async (notification) => ({
        ...notification,
        created: formatTimestamp(new Date(notification.createdAt)), 
        mediaUrl: notification.mediaUrl ? await generatePresignedUrl(notification.mediaUrl) : null
      })));
      return res.status(200).json({ notifications: formattedNotifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Error fetching notifications' });
    }
  }
  

  public static markRead = async (req: Request, res: Response) => {
    const { notificationId } = req.body;

    if (!notificationId ) {
      return res.status(400).json({ error: "notificationId required" });
    }

    try {
      const notificationRepo = AppDataSource.getRepository(Notifications);

      let  notification = await notificationRepo.findOne({ where: { id: notificationId } });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found or invalid userId" });
      }

      // Update the notification as read
      notification.isRead = true;
     notification =  await notificationRepo.save(notification);

      // Emit real-time event to update the client
      const io = getSocketInstance();
      io.to(notification.userId).emit("notificationUpdated", notification);

      return res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ error: "Error marking notification as read" });
    }
  };

  // Mark all notifications as read
  public static markAllRead = async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    try {
      const notificationRepo = AppDataSource.getRepository(Notifications);

      // Update all unread notifications for the user
     const notification =  await notificationRepo
        .createQueryBuilder()
        .update(Notifications)
        .set({ isRead: true })
        .where("userId = :userId AND isRead = false", { userId })
        .execute();

      // Emit real-time event to update all notifications on the client
      const io = getSocketInstance();
      io.to(userId).emit("allNotificationsUpdated", notification);

      return res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return res.status(500).json({ error: "Error marking all notifications as read" });
    }
  };

  // Broadcast notification to all connected clients
    public static broadcastNotification(message: string) {
      // this.clients.forEach((client) => {
      //   if (client.readyState === WebSocket.OPEN) {
      //     client.send(JSON.stringify({ type: 'receive-notification', message }));
      //   }
      // });
      console.log(`Broadcast notification: ${message}`);
    }
}




  // Send notification component 
  export const sendNotification = async (userId:string, message:string, mediakey:any, navigation:string) => {
    
    if (!userId || !message) {
      return 'userId and message are required' ;
    }

    try {
      const userRepos = AppDataSource.getRepository(PersonalDetails);
      const user = await userRepos.findOne({ where: { id: userId } });

      if (!user) {
        return  'User ID is invalid or does not exist.';
      }
     
      // Create a new notification
      const notificationRepo = AppDataSource.getRepository(Notifications);
      const notification = notificationRepo.create({
        userId,
        message,
        mediaUrl : (mediakey!==null || mediakey!==undefined)?mediakey:null,
        navigation,
        createdBy: "Live",
        createdAt: new Date()
      });
      // Send notification via WebSocket
      const io = getSocketInstance();
      const noticeInfo = io.to(userId).emit("notifications", notification);

      if (noticeInfo) {
        await notificationRepo.save(notification); 
        return  "Notification sent successfully" ;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return 'Error sending notification' ;
    }
  };

  // delete notification component
  export const deleteNotification = async (userId:string) => {
    if (!userId ) {
      return "notificationId required" ;
    }
    try {
      const notificationRepo = AppDataSource.getRepository(Notifications);
      let  notification = await notificationRepo.findOne({ where: { userId } });
      if (!notification) {
        return "Notification not found or invalid userId" ;
      }
      notification.isRead = true;
   await notificationRepo.save(notification);

      // Emit real-time event to update the client
      // const io = getSocketInstance();
      // io.to(userId).emit('notifications', savedNotification);
      return "Notification marked as read" ;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return "Error marking notification as read" ;
    }
  };