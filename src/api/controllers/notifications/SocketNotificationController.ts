// import { Notifications } from '@/api/entity/notifications/Notifications';
// import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
// import { AppDataSource } from '@/server';
// import WebSocket, { WebSocketServer } from 'ws';

// class WebSocketNotification {
//   private static wss: WebSocketServer;
//   private static clients: Map<string, WebSocket> = new Map();

//   public static initialize(port: number) {
//     this.wss = new WebSocketServer({ port });
//     console.log(`WebSocket server initialized on port ${port}`);

//     this.wss.on('connection', (ws: WebSocket) => {
//       console.log('New client connected.');

//       ws.on('message', (data) => {
//         const parsedData = JSON.parse(data.toString());
//         if (parsedData.type === 'join') {
//           const { userId } = parsedData;
//           console.log(`User joined: ${userId}`);
//           this.clients.set(userId, ws);
//         }
//       });

//       ws.on('close', () => {
//         console.log('Client disconnected.');
//         this.removeClient(ws);
//       });
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

//   public static sendNotification = async (req: Request, res: Response) => {
//     const { userId, message } = req.body;

//     if (!userId || !message) {
//       return res.status(400).json({ error: 'userId and message are required' });
//     }
//     try {
//       const userRepos = AppDataSource.getRepository(PersonalDetails);
//       const user = await userRepos.findOne({ where: { id: userId } });
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User ID is invalid or does not exist.',
//         });
//       }

//       const notification = new Notifications();
//       notification.userId = userId;
//       notification.message = message;
//       notification.createdBy = 'Live';
//       await AppDataSource.manager.save(notification);

//       // Emit notification to the user through WebSocket
//       const client = this.clients.get(userId);
//       if (client && client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify({ type: 'receive-notification', message }));
//         console.log(`Notification sent to user ${userId}: ${message}`);
//       }

//       return res.status(200).json({ message: 'Notification sent successfully' });
//     } catch (error) {
//       console.error('Error sending notification:', error);
//       return res.status(500).json({ error: 'Error sending notification' });
//     }
//   };

//   public static getNotification = async (req: Request, res: Response) => {
//     const { userId } = req.query;

//     if (!userId) {
//       return res.status(400).json({ error: 'userId is required' });
//     }

//     try {
//       const notifications = await AppDataSource.manager.find(Notifications, {
//         where: { userId: String(userId) },
//         order: { createdAt: 'DESC' },
//       });

//       return res.status(200).json({ notifications });
//     } catch (error) {
//       console.error('Error fetching notifications:', error);
//       return res.status(500).json({ error: 'Error fetching notifications' });
//     }
//   };

//   public static sendLikeNotification = async (req: Request, res: Response) => {
//     const { userId, postId } = req.body;

//     if (!userId || !postId) {
//       return res.status(400).json({ error: 'userId and postId are required' });
//     }

//     try {
//       const userRepos = AppDataSource.getRepository(PersonalDetails);
//       const user = await userRepos.findOne({ where: { id: userId } });
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User ID is invalid or does not exist.',
//         });
//       }

//       const notification = new Notifications();
//       notification.userId = userId;
//       notification.message = `Your post with ID ${postId} was liked.`;
//       notification.createdBy = 'Like';
//       await AppDataSource.manager.save(notification);

//       // Emit notification to the user through WebSocket
//       const client = this.clients.get(userId);
//       if (client && client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify({ type: 'receive-notification', message: notification.message }));
//         console.log(`Like notification sent to user ${userId}: ${notification.message}`);
//       }

//       return res.status(200).json({ message: 'Like notification sent successfully' });
//     } catch (error) {
//       console.error('Error sending like notification:', error);
//       return res.status(500).json({ error: 'Error sending like notification' });
//     }
//   };

//   public static broadcastNotification(message: string) {
//     this.clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify({ type: 'receive-notification', message }));
//       }
//     });
//     console.log(`Broadcast notification: ${message}`);
//   }
// }

// export { WebSocketNotification };
