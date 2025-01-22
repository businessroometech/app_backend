import { Notifications } from '@/api/entity/notifications/Notifications';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';
import { Server, Socket } from 'socket.io';

class SocketNotification {
    private static io: Server;
  public static initialize(io: Server) {
    this.io = io;
    if (!this.io) {
      console.error('Socket.IO is not initialized correctly.');
      return;
    }
    this.io.on('connection', (socket: Socket) => {
      console.log(`New client connected: ${socket.id}`);
      socket.on('join', (userId: string) => {
        console.log(`User joined: ${userId}`);
        socket.join(userId);
      });
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
      socket.emit('receive-notification', { message: 'New notification!' });
    });
  }
    public static sendNotification = async (req: Request, res: Response) => {
      const { userId, message } = req.body;
  
      if (!userId || !message) {
        return res.status(400).json({ error: 'userId and message are required' });
      }
  
      try {
        const userRepos = AppDataSource.getRepository(PersonalDetails);
  
        const user = await userRepos.findOne({ where: { id: userId } });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User ID is invalid or does not exist.',
          });
        }
        const notification = new Notifications();
        notification.userId = userId;
        notification.message = message;
        notification.createdBy = 'Live'; 
        await AppDataSource.manager.save(notification);
  
        // Emit notification to the user through Socket.IO
        this.io.to(userId).emit('receive-notification', { message });
  
        console.log(`Notification sent to user ${userId}: ${message}`);
  
        return res.status(200).json({ message: 'Notification sent successfully' });
      } catch (error) {
        console.error('Error sending notification:', error);
        return res.status(500).json({ error: 'Error sending notification' });
      }
    };
  
    // Method to get notifications for a specific user
    public static getNotification = async (req: Request, res: Response) => {
      const { userId } = req.query;
  
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
  
      try {
        const notifications = await AppDataSource.manager.find(Notifications, {
          where: { userId: String(userId) },
          order: { createdAt: 'DESC' },
        });
  
        return res.status(200).json({ notifications });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Error fetching notifications' });
      }
    };
  
    // Optional: Method to broadcast notification to all users
    public static broadcastNotification = (message: string) => {
      this.io.emit('receive-notification', { message });
    };
  }
  
  // Utility function to ensure Socket.IO instance is properly initialized
  function getSocketInstance(): Server {
    if (!SocketNotification['io']) {
      throw new Error('Socket.io instance has not been initialized.');
    }
    return SocketNotification['io'];
  }
  
  export { SocketNotification };

