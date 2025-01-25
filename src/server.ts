import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { DataSource } from 'typeorm';
import { WebSocketServer } from 'ws';

import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';
import { env } from '@/common/utils/envConfig';

import authRouter from '../src/api/routes/auth/AuthRoutes';
import BusinessBuyerRoute from '../src/api/routes/BusinessBuyer/BusinessBuyerRoute';
import BuisnessSeller from '../src/api/routes/BusinessSellerRoutes/BusinessSellerRoutes';
import chatRouter from '../src/api/routes/chat/MessageRoutes';
import connectionRouter from '../src/api/routes/connection/Connection';
import EntrepreneurRoutes from '../src/api/routes/Entrepreneur/EntrepreneurRoutes';
import InvestorRoute from '../src/api/routes/InvestorRoute/InvestorRoute';
import notifications from '../src/api/routes/notification/Notifications';
import userPost from '../src/api/routes/userPost/UserPost';
import chatRouter from '../src/api/routes/chat/MessageRoutes';
import liveRouter from '../src/api/routes/live/LiveRoutes';

// import { WebSocketNotification } from './api/controllers/notifications/SocketNotificationController';
import { BusinessForSale } from './api/entity/BuisnessSeller/BuisnessSeller';
import { BusinessBuyer } from './api/entity/BusinessBuyer/BusinessBuyer';
import { Message } from './api/entity/chat/Message';
import { Connection } from './api/entity/connection/Connections';
import { Entrepreneur } from './api/entity/Entrepreneur/EntrepreneurProfile';
import { Investor } from './api/entity/Investors/Investor';
import { Notifications } from './api/entity/notifications/Notifications';
import { ProfileVisit } from './api/entity/notifications/ProfileVisit';
import { PersonalDetails } from './api/entity/personal/PersonalDetails';
import { Comment } from './api/entity/posts/Comment';
import { CommentLike } from './api/entity/posts/CommentLike';
import { Like } from './api/entity/posts/Like';
import { NestedComment } from './api/entity/posts/NestedComment';
import { UserPost } from './api/entity/UserPost';
// import SocketNotificationRouting from './api/routes/notification/SocketNotificationRouting';
import { Message } from './api/entity/chat/Message';
import { initializeSocket } from './socket';

const logger = pino({ name: 'server start' });
const app: Express = express();

// Create a DataSource instance
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_HOST : process.env.DEV_AWS_HOST,
  port: 3306,
  username: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_USERNAME : process.env.DEV_AWS_USERNAME,
  password: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_PASSWORD : process.env.DEV_AWS_PASSWORD,
  database: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_DB_NAME : process.env.DEV_AWS_DB_NAME,
  entities: [
    UserPost,
    PersonalDetails,
    Comment,
    CommentLike,
    Like,
    NestedComment,
    Notifications,
    Connection,
    BusinessForSale,
    BusinessBuyer,
    Investor,
    Entrepreneur,
    PersonalDetails,
    Message,
    ProfileVisit,
    Wishlists,
  ],
  synchronize: false,
});

// Initialize the DataSource
AppDataSource.initialize()
  .then(() => {
    console.log('DB connected');
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

// Middleware setup
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true); // Allow all origins
    },
    credentials: true,
  })
);
app.use(helmet());
// app.use(rateLimiter);
app.use(requestLogger);
app.use(express.json());

// Routes mounting
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/post', userPost);
app.use('/api/v1/notifications', notifications);
app.use('/api/v1/connection', connectionRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/businessseller', BuisnessSeller);
app.use('/investor', InvestorRoute);
app.use('/businessbuyer', BusinessBuyerRoute);
app.use('/entrepreneur', EntrepreneurRoutes);
app.use('/api/v1/live', liveRouter);
// app.use('/api/v1/socket-notifications', SocketNotificationRouting);

// Test route
app.get('/', (req, res) => {
  res.send('Welcome to BusinessRoom AI');
});

// Error handlers
app.use(errorHandler());

// Initialize HTTP server and WebSocket
const httpServer = initializeSocket(app);

// Set up WebSocket server
// const wss = new WebSocketServer({ server: httpServer });

// wss.on('connection', (ws, req) => {
//   console.log('New WebSocket connection established');
//   ws.on('message', (message) => {
//     console.log(`Received: ${message}`);
//     // Handle messages, e.g., join room, send notifications, etc.
//   });
//   ws.on('close', () => {
//     console.log('WebSocket connection closed');
//   });

//   // Example: Send notification to client
//   ws.send(JSON.stringify({ message: 'Welcome to WebSocket notifications!' }));
// });

export { app, AppDataSource, httpServer, logger };

// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import express, { Express } from 'express';
// import helmet from 'helmet';
// import { createServer } from 'http';
// import { pino } from 'pino';
// import { Server } from 'socket.io';
// import { DataSource } from 'typeorm'; // Import DataSource/ Import your environment variables

// import errorHandler from '@/common/middleware/errorHandler';
// import rateLimiter from '@/common/middleware/rateLimiter';
// import requestLogger from '@/common/middleware/requestLogger';
// import { env } from '@/common/utils/envConfig';

// import authRouter from '../src/api/routes/auth/AuthRoutes';
// import BusinessBuyerRoute from '../src/api/routes/BusinessBuyer/BusinessBuyerRoute';
// import BuisnessSeller from '../src/api/routes/BusinessSellerRoutes/BusinessSellerRoutes';
// import connectionRouter from '../src/api/routes/connection/Connection';
// import EntrepreneurRoutes from '../src/api/routes/Entrepreneur/EntrepreneurRoutes';
// import InvestorRoute from '../src/api/routes/InvestorRoute/InvestorRoute';
// import notifications from '../src/api/routes/notification/Notifications';
// import userPost from '../src/api/routes/userPost/UserPost';
// import chatRouter from '../src/api/routes/chat/MessageRoutes';
// import { SocketNotification } from './api/controllers/notifications/SocketNotificationController';
// import { BusinessForSale } from './api/entity/BuisnessSeller/BuisnessSeller';
// import { BusinessBuyer } from './api/entity/BusinessBuyer/BusinessBuyer';
// import { Connection } from './api/entity/connection/Connections';
// import { Entrepreneur } from './api/entity/Entrepreneur/EntrepreneurProfile';
// import { Investor } from './api/entity/Investors/Investor';
// import { Notifications } from './api/entity/notifications/Notifications';
// import { PersonalDetails } from './api/entity/personal/PersonalDetails';
// import { Comment } from './api/entity/posts/Comment';
// import { CommentLike } from './api/entity/posts/CommentLike';
// import { Like } from './api/entity/posts/Like';
// import { NestedComment } from './api/entity/posts/NestedComment';
// import { UserPost } from './api/entity/UserPost';
// import SocketNotificationRouting from './api/routes/notification/SocketNotificationRouting';
// import { Message } from './api/entity/chat/Message';

// const logger = pino({ name: 'server start' });
// const app: Express = express();

// const httpServer = createServer(app);
// const io = new Server(httpServer, {
//   cors: { origin: '*' },
// });

// // Create a DataSource instance
// const AppDataSource = new DataSource({
//   type: 'mysql',
//   host: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_HOST : process.env.DEV_AWS_HOST,
//   port: 3306,
//   username: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_USERNAME : process.env.DEV_AWS_USERNAME,
//   password: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_PASSWORD : process.env.DEV_AWS_PASSWORD,
//   database: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_DB_NAME : process.env.DEV_AWS_DB_NAME,
//   entities: [
//     UserPost,
//     Comment,
//     CommentLike,
//     Like,
//     NestedComment,
//     Notifications,
//     Connection,
//     BusinessForSale,
//     BusinessBuyer,
//     Investor,
//     Entrepreneur,
//     PersonalDetails,
//     Message
//   ],
//   synchronize: false,
// });

// // Serve the public folder for Swagger UI assets
// // app.use(express.static('dist/public'));

// // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// // Initialize the DataSource
// AppDataSource.initialize()
//   .then(() => {
//     console.log('DB connected');

//     io.on('connection', (socket) => {
//       console.log('New client connected:', socket.id);

//       // Join a room for a specific user (based on user ID)
//       socket.on('joinRoom', (userId) => {
//         socket.join(userId);
//         console.log(`User ${userId} joined their room`);
//       });

//       // Disconnect event
//       socket.on('disconnect', () => {
//         console.log('Client disconnected:', socket.id);
//       });
//     });

//   })
//   .catch((error) => {
//     console.error('Error during Data Source initialization:', error);
//   });

// // app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       callback(null, true); // Allow all origins
//     },
//     credentials: true,
//   })
// );
// app.use(helmet());
// app.use(rateLimiter);

// // Request logging
// app.use(requestLogger);

// // Initialize SocketNotification
// SocketNotification.initialize(io);

// // Routes mounting
// app.use(express.json());
// app.use('/api/v1/auth', authRouter);

// app.use('/api/v1/post', userPost);
// app.use('/api/v1/notifications', notifications);
// app.use('/api/v1/connection', connectionRouter);
// app.use('/api/v1/chat', chatRouter);

// app.use('/businessseller', BuisnessSeller);
// app.use('/investor', InvestorRoute);
// app.use('/businessbuyer', BusinessBuyerRoute);
// app.use('/entrepreneur', EntrepreneurRoutes);

// app.use('/api/v1/socket-notifications', SocketNotificationRouting); // Add new notification route
// //heyyy//
// // testing api route
// app.get('/', (req, res) => {
//   res.send('woooohoooooooooooo');
// });

// // Error handlers
// app.use(errorHandler());

// export { app, AppDataSource, logger };
