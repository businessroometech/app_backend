import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from 'http';
import { pino } from 'pino';
import { Server } from 'socket.io';
import { DataSource } from 'typeorm'; 

import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';
import { env } from '@/common/utils/envConfig';

import authRouter from '../src/api/routes/auth/AuthRoutes';
import BusinessBuyerRoute from '../src/api/routes/BusinessBuyer/BusinessBuyerRoute';
import BuisnessSeller from '../src/api/routes/BusinessSellerRoutes/BusinessSellerRoutes';
import connectionRouter from '../src/api/routes/connection/Connection';
import EntrepreneurRoutes from '../src/api/routes/Entrepreneur/EntrepreneurRoutes';
import InvestorRoute from '../src/api/routes/InvestorRoute/InvestorRoute';
import notifications from '../src/api/routes/notification/Notifications';
import userPost from '../src/api/routes/userPost/UserPost';
import { BusinessForSale } from './api/entity/BuisnessSeller/BuisnessSeller';
import { BusinessBuyer } from './api/entity/BusinessBuyer/BusinessBuyer';
import { Connection } from './api/entity/connection/Connections';
import { Entrepreneur } from './api/entity/Entrepreneur/EntrepreneurProfile';
import { Investor } from './api/entity/Investors/Investor';
import { Notifications } from './api/entity/notifications/Notifications';
import { PersonalDetails } from './api/entity/personal/PersonalDetails';
import { Comment } from './api/entity/posts/Comment';
import { Like } from './api/entity/posts/Like';
import { NestedComment } from './api/entity/posts/NestedComment';
import { UserPost } from './api/entity/UserPost';
import { setWebSocketServer } from './api/controllers/chat/Message';
const logger = pino({ name: 'server start' });
const app: Express = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const wss = new WebSocketServer({ server: httpServer });
setWebSocketServer(wss);

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
    Like,
    NestedComment,
    Notifications,
    Connection,
    BusinessForSale,
    BusinessBuyer,
    Investor,
    Entrepreneur,

  ],
  synchronize: false,
  // ... other TypeORM configuration options (entities, synchronize, etc.)
});

// Serve the public folder for Swagger UI assets
// app.use(express.static('dist/public'));

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Initialize WebSocket Server
wss.on('connection', (socket: WebSocket, req) => {
  const params = new URLSearchParams(req.url?.split('?')[1]);
  const userId = params.get('userId'); // Retrieve userId from query parameters
  (socket as any).userId = userId; // Attach userId to socket

  logger.info(`New WebSocket connection established for userId: ${userId}`);

  // Listen for messages
  socket.on('message', (message) => {
    logger.info(`Message received from userId ${userId}: ${message}`);

    // Broadcast message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle WebSocket disconnection
  socket.on('close', () => {
    logger.info(`WebSocket connection closed for userId: ${userId}`);
  });

  // Handle errors
  socket.on('error', (err) => {
    logger.error(`WebSocket error for userId ${userId}: ${err.message}`);
  });
});

// Initialize DataSource and start server
AppDataSource.initialize()
  .then(() => {
    logger.info('Database connected successfully.');

    // Start HTTP server
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Error during DataSource initialization:', error);
  });


// app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
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

// Request logging
app.use(requestLogger);

// Routes mounting
app.use(express.json());
app.use('/api/v1/auth', authRouter);

app.use('/api/v1/post', userPost);
app.use('/api/v1/notifications', notifications);
app.use('/api/v1/connection', connectionRouter);

app.use('/businessseller', BuisnessSeller);
app.use('/investor', InvestorRoute);
app.use('/businessbuyer', BusinessBuyerRoute);
app.use('/entrepreneur', EntrepreneurRoutes);

// testing api route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Error handlers
app.use(errorHandler());

export { app, AppDataSource, logger };
