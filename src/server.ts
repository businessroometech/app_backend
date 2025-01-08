import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';
import { env } from '@/common/utils/envConfig';
import authRouter from '../src/api/routes/auth/AuthRoutes';
import userPost from '../src/api/routes/userPost/UserPost';
import notifications from '../src/api/routes/notification/Notifications';
import connectionRouter from '../src/api/routes/connection/connection'

import { DataSource } from 'typeorm'; // Import DataSource/ Import your environment variables
import { UserLogin } from './api/entity/user/UserLogin';
import { UserPost } from './api/entity/UserPost';
import { PersonalDetails } from './api/entity/personal/PersonalDetails';
import { Like } from './api/entity/posts/Like';
import { Comment } from './api/entity/posts/Comment';
import { NestedComment } from './api/entity/posts/NestedComment';
import { createServer } from "http";
import { Server } from "socket.io";
import { Notifications } from './api/entity/notifications/Notifications';
import { Connection } from './api/entity/connection/Connections';

const logger = pino({ name: 'server start' });
const app: Express = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});


// Create a DataSource instance
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_HOST : process.env.DEV_AWS_HOST,
  port: 3306,
  username: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_USERNAME : process.env.DEV_AWS_USERNAME,
  password: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_PASSWORD : process.env.DEV_AWS_PASSWORD,
  database: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_DB_NAME : process.env.DEV_AWS_DB_NAME,
  entities: [
    UserLogin, UserPost, PersonalDetails, Comment, Like, NestedComment, Notifications, Connection
  ],
  synchronize: false,
  // ... other TypeORM configuration options (entities, synchronize, etc.)
});

// Serve the public folder for Swagger UI assets
// app.use(express.static('dist/public'));

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Initialize the DataSource
AppDataSource.initialize()
  .then(() => {
    console.log('DB connected');
    
    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
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
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes mounting

app.use(express.json()); 
app.use('/api/v1/auth', authRouter);

app.use('/api/v1/post', userPost);
app.use('/api/v1/notifications', notifications);
app.use('/api/v1/connection', connectionRouter )

// testing api route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Error handlers
app.use(errorHandler());

export { app, logger, AppDataSource };


