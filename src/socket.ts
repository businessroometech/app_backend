import { Server } from 'socket.io';
import { createServer } from 'http';
import { Express, Request, Response } from 'express';
import { AppDataSource } from './server';
import { ActiveUser } from './api/entity/chat/ActiveUser';
import jwt from "jsonwebtoken";
import { Notify } from './api/entity/notify/Notify';
import { Message } from './api/entity/chat/Message';
import { MessageHistory } from './api/entity/chat/MessageHistory';

let io: Server;

export const initializeSocket = (app: Express) => {
  const httpServer = createServer(app);
  io = new Server(httpServer, {
    cors: { origin: '*', credentials: true, methods: ['GET', 'POST'] },
  });

  const toggleActive = async (isActive: boolean, userId: string) => {
    const activeUserRepo = AppDataSource.getRepository(ActiveUser);

    const isUser = await activeUserRepo.findOne({ where: { userId } });

    if (isUser) {
      isUser.isActive = isActive;
      await isUser.save();
    }
    else {
      const isUser = activeUserRepo.create({
        userId,
        isActive
      });

      await isUser.save();
    }
  }

  const JWT_SECRET = process.env.ACCESS_SECRET_KEY as string;

  const getUserIdFromToken = (token: string): string | null => {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables.");
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error: any) {
      console.error("Invalid token:", error.message);
      return null;
    }
  };

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinChatRoom', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('joinNotificationRoom', (userId) => {
      // const userId: any = getUserIdFromToken(token);
      socket.join(userId);
      // console.log(`User ${userId} joined their room`);
    });

    socket.on('userOnline', async (token) => {
      const userId: any = getUserIdFromToken(token);
      if (userId) {
        await toggleActive(true, userId);
        console.log(`User ${userId} is online`);

        const NotifyRepo = AppDataSource.getRepository(Notify);
        const [notifcation, notifyCount] = await NotifyRepo.findAndCount({ where: { recieverId: userId, isRead: false } });

        const messageRepo = AppDataSource.getRepository(Message);
        const messageHistoryRepo = AppDataSource.getRepository(MessageHistory);

        const history = await messageHistoryRepo.find({
          where: [
            { senderId: userId },
            { receiverId: userId }
          ],
        });

        const unreadMessagesCount = (await Promise.all(
          (history || []).map(async (his) => {
            let myId = his.receiverId === userId ? his.receiverId : his.senderId;
            let otherId = his.receiverId === userId ? his.senderId : his.receiverId;

            const count = await messageRepo.count({
              where: { receiverId: myId, senderId: otherId, isRead: false },
            });

            return count > 0 ? { senderId: otherId, receiverId: myId, unReadCount: count } : null;
          })
        )).filter((item) => item !== null);

        socket.emit('initialize', {
          userId,
          welcomeMessage: 'Welcome to BusinessRoom!',
          unreadNotificationsCount: notifyCount ? notifyCount : 0,
          unreadMessagesCount: unreadMessagesCount ? unreadMessagesCount.length : 0,
        });
      }
    });

    socket.on('userOffline', (token) => {
      const userId: any = getUserIdFromToken(token);
      toggleActive(false, userId);
      console.log(`User ${userId} is online`);
    });


    // Broadcast message to all clients
    socket.on('broadcastMessage', (message) => {
      console.log('Broadcasting message:', message);
      io.emit('receiveBroadcast', { message });
    });

    // Broadcast message to a specific room
    socket.on('broadcastToRoom', ({ roomId, message }) => {
      console.log(`Broadcasting to room ${roomId}:`, message);
      socket.to(roomId).emit('receiveRoomBroadcast', { roomId, message });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return httpServer;
};

export const broadcastMessage = (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  io.emit('receiveBroadcast', { message });
  return res.status(200).json({ status: 'success', message: 'Broadcast sent' });
};

export const getSocketInstance = () => io;
