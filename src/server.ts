import axios from 'axios';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
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

import BuisnessDataRoutes from '../src/api/routes/business-data/BusinessRoutes';

import chatRouter from '../src/api/routes/chat/MessageRoutes';
// import chatRouter from '../src/api/routes/chat/MessageRoutes';
import connectionRouter from '../src/api/routes/connection/Connection';
import EntrepreneurRoutes from '../src/api/routes/Entrepreneur/EntrepreneurRoutes';
import GeneralRoutes from '../src/api/routes/GneralRoutes/GeneralRoutes';
import InvestorRoute from '../src/api/routes/InvestorRoute/InvestorRoute';
import liveRouter from '../src/api/routes/live/LiveRoutes';
import notifications from '../src/api/routes/notification/Notifications';
import userPost from '../src/api/routes/userPost/UserPost';
import WishlistsRoutes from '../src/api/routes/Wishlists/WishlistsRoutes';
// import { WebSocketNotification } from './api/controllers/notifications/SocketNotificationController';
import { BusinessForSale } from './api/entity/BuisnessSeller/BuisnessSeller';
import { BusinessBuyer } from './api/entity/BusinessBuyer/BusinessBuyer';
import { ActiveUser } from './api/entity/chat/ActiveUser';
import { Message } from './api/entity/chat/Message';
// import { Message } from './api/entity/chat/Message';
// import SocketNotificationRouting from './api/routes/notification/SocketNotificationRouting';
// import { Message } from './api/entity/chat/Message';
import { Connection } from './api/entity/connection/Connections';
import { Entrepreneur } from './api/entity/Entrepreneur/EntrepreneurProfile';
import { General } from './api/entity/General/GeneralProfile';
import { Investor } from './api/entity/Investors/Investor';
import { Notifications } from './api/entity/notifications/Notifications';
import { ProfileVisit } from './api/entity/notifications/ProfileVisit';
import { PersonalDetails } from './api/entity/personal/PersonalDetails';
import { BlockedPost } from './api/entity/posts/BlockedPost';
import { BlockedUser } from './api/entity/posts/BlockedUser';
import { Comment } from './api/entity/posts/Comment';
import { CommentLike } from './api/entity/posts/CommentLike';
import { Hashtag } from './api/entity/posts/Hashtag';
import { Like } from './api/entity/posts/Like';
import { Mention } from './api/entity/posts/Mention';
import { NestedComment } from './api/entity/posts/NestedComment';
import { Reaction } from './api/entity/posts/Reaction';
import { SubRole } from './api/entity/SubRole/Subrole';
import { UserPost } from './api/entity/UserPost';
import { Wishlists } from './api/entity/WishLists/Wishlists';
import SocketNotificationRouting from './api/routes/notification/SocketNotificationRouting';
import SubRoleRoutes from './api/routes/SubRole/SubRoleRoutes';
import { initializeSocket } from './socket';

import { ReportedPost } from './api/entity/posts/ReportedPost';
import { ReportedUser } from './api/entity/posts/ReportedUser';
import { Account } from './api/entity/LandingPage/Account';
import { Connect } from './api/entity/LandingPage/Connect';
import { NestedCommentLike } from './api/entity/posts/NestedCommentLike';
import { PollEntry } from './api/entity/posts/PollEntry';
import { InvestorData } from './api/entity/business-data/InvestorData';
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
    Reaction,
    Mention,
    Hashtag,
    Wishlists,
    ActiveUser,
    SubRole,
    BlockedPost,
    BlockedUser,
    ReportedPost,
    ReportedUser,
    General,
    Account,
    Connect,
    NestedCommentLike,
    PollEntry,
    InvestorData
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
// app.use(express.urlencoded({ extended: true }));


// Routes mounting
app.use('/v1/auth', authRouter);
app.use('/v1/post', userPost);
app.use('/v1/notifications', notifications);
app.use('/v1/connection', connectionRouter);
app.use('/v1/chat', chatRouter);
app.use('/v1/businessseller', BuisnessSeller);
app.use('/v1/investor', InvestorRoute);
app.use('/v1/businessbuyer', BusinessBuyerRoute);
app.use('/v1/entrepreneur', EntrepreneurRoutes);
app.use('/v1/live', liveRouter);
app.use('/v1/wishlists', WishlistsRoutes);
app.use('/v1/socket-notifications', SocketNotificationRouting);
app.use('/v1/subrole', SubRoleRoutes);
app.use('/v1/general', GeneralRoutes);
app.use('/v1/business-data', BuisnessDataRoutes);
// Test route
app.get('/', (req, res) => {
  res.send('Welcome to BusinessRoom');
});

// Route to fetch metadata
app.get('/fetch-metadata', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });

    const response = await axios.get(url as string, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    res.send(response.data);
  } catch (error: any) {
    console.error('Error fetching metadata:', error.message);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Error handlers
app.use(errorHandler());

// Initialize HTTP server and WebSocket
const httpServer = initializeSocket(app);

export { app, AppDataSource, httpServer, logger };
