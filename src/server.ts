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

import BuisnessDataRoutes from '../src/api/routes/business-data/BusinessRoutes';

import chatRouter from '../src/api/routes/chat/MessageRoutes';
// import chatRouter from '../src/api/routes/chat/MessageRoutes';
import connectionRouter from '../src/api/routes/connection/Connection';
import liveRouter from '../src/api/routes/live/LiveRoutes';
import notifications from '../src/api/routes/notification/Notifications';
import userPost from '../src/api/routes/userPost/UserPost';
import acquireroomRoutes from '../src/api/routes/accquireroom/Accquireroom';
import mentionRouter from '../src/api/routes/mention/Mention';
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
import { initializeSocket } from './socket';

import { ReportedPost } from './api/entity/posts/ReportedPost';
import { ReportedUser } from './api/entity/posts/ReportedUser';
import { Account } from './api/entity/LandingPage/Account';
import { Connect } from './api/entity/LandingPage/Connect';
import { NestedCommentLike } from './api/entity/posts/NestedCommentLike';
import { PollEntry } from './api/entity/posts/PollEntry';
import { InvestorData } from './api/entity/business-data/InvestorData';
import { AquiringStartup } from './api/entity/business-data/AquiringStartup';
import { SellingStartup } from './api/entity/business-data/SellingStartup';
import { SeekingConnections } from './api/entity/business-data/SeekingConnections';
import { ExploringIdeas } from './api/entity/business-data/ExploringIdeas';
import { Notify } from './api/entity/notify/Notify';
import { MessageHistory } from './api/entity/chat/MessageHistory';
import { Ristriction } from './api/entity/ristrictions/Ristriction';
import { BasicSelling } from './api/entity/business-data/BasicSelling';
import { MentionUser } from './api/entity/mention/mention';

// Migration import -
import { UserPostNew } from './api/entity/UserPostNew';
import { CommentNew } from './api/entity/posts/CommentNew';
import { CommentLikeNew } from './api/entity/posts/CommentLikeNew';
import { LikeNew } from './api/entity/posts/LikeNew';
import { NestedCommentNew } from './api/entity/posts/NestedCommentNew';
import { NestedCommentLikeNew } from './api/entity/posts/NestedCommentLikeNew';
import { ConnectionsNew } from './api/entity/connection/ConnectionsNew';
import Migration from './api/routes/data-migration/migration';

const logger = pino({ name: 'server start' });
const app: Express = express();

// import Redis from "ioredis";

// export const client = new Redis({
//   host: "127.0.0.1",
//   port: 6379,
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

// (async () => {
//   const setResult = await client.set("testKey", "hello");
//   console.log("SET result:", setResult);

//   const getResult = await client.get("testKey");
//   console.log("GET result:", getResult);

//   client.disconnect();
// })();

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
    // BusinessForSale,
    // BusinessBuyer,
    Investor,
    // Entrepreneur,
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
    // General,
    Account,
    Connect,
    NestedCommentLike,
    PollEntry,
    InvestorData,
    AquiringStartup,
    SellingStartup,
    SeekingConnections,
    ExploringIdeas,
    BasicSelling,
    Notify,
    MessageHistory,
    Ristriction,
    MentionUser,
    UserPostNew,
    CommentNew,
    CommentLikeNew,
    LikeNew,
    NestedCommentNew,
    NestedCommentLikeNew,
    ConnectionsNew,
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
// app.use(requestLogger);
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Routes mounting
app.use('/v1/auth', authRouter);
app.use('/v1/post', userPost);
app.use('/v1/notification', notifications);
app.use('/v1/connection', connectionRouter);
app.use('/v1/chat', chatRouter);
// app.use('/v1/businessseller', BuisnessSeller);
// app.use('/v1/investor', InvestorRoute);
// app.use('/v1/businessbuyer', BusinessBuyerRoute);
// app.use('/v1/entrepreneur', EntrepreneurRoutes);
app.use('/v1/live', liveRouter);
// app.use('/v1/wishlists', WishlistsRoutes);
app.use('/v1/socket-notifications', SocketNotificationRouting);
// app.use('/v1/subrole', SubRoleRoutes);
// app.use('/v1/general', GeneralRoutes);
app.use('/v1/business-data', BuisnessDataRoutes);
app.use('/v1/acquireroom', acquireroomRoutes);
app.use('/v1', mentionRouter);

// data migration route
app.use('/migration', Migration);

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
