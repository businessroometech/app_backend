import { Server } from 'socket.io';
import { createServer } from 'http';
import { Express, Request, Response } from 'express';

let io: Server;

let onlineUsers: any = {};

export const initializeSocket = (app: Express) => {
  const httpServer = createServer(app);
  io = new Server(httpServer, {
    cors: { origin: '*', credentials: true, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinRoom', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("userOnline", (userId) => {
      onlineUsers[userId] = socket.id;
      console.log(`User ${userId} is online`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const userId = Object.keys(onlineUsers).find((key) => onlineUsers[key] === socket.id);
      if (userId) {
        delete onlineUsers[userId];
        console.log(`User ${userId} is offline`);
      }
    });
  });

  return httpServer;
};

export const getOnlineUsers = async (req: Request, res: Response) => {
    res.status(200).json({ 
      status: "success",
      message: "active users fetched",
      data: {
        onlineUsers
      }
    })
};

export const getSocketInstance = () => io;
