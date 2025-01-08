import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';

import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';

//import { env } from '@/common/utils/envConfig';
import authRouter from '../src/api/routes/auth/AuthRoutes';
import BusinessSellerRouter from '../src/api/routes/BusinessSellerRoutes/BusinessSellerRoutes';
import userPost from '../src/api/routes/userPost/UserPost';
//import investorroutes from './api/routes/InvestorRoute/InvestorRoute';

const logger = pino({ name: 'server start' });
const app: Express = express();

import { DataSource } from 'typeorm'; // Import DataSource/ Import your environment variables

import { BusinessForSale } from './api/entity/BuisnessSeller/BuisnessSeller';
import { Investor } from './api/entity/Investors/Investor';
import { PersonalDetails } from './api/entity/personal/PersonalDetails';
import { Comment } from './api/entity/posts/Comment';
import { Like } from './api/entity/posts/Like';
import { NestedComment } from './api/entity/posts/NestedComment';
import { UserLogin } from './api/entity/user/UserLogin';
import { UserPost } from './api/entity/UserPost';

// Create a DataSource instance
const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost', //process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_HOST : process.env.DEV_AWS_HOST,
  port: 3306,
  username: 'root', //process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_USERNAME : process.env.DEV_AWS_USERNAME,
  password: 'ajaygaur01', //process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_PASSWORD : process.env.DEV_AWS_PASSWORD,
  database: 'seller', //process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_DB_NAME : process.env.DEV_AWS_DB_NAME,
  entities: [UserLogin, UserPost, PersonalDetails, Comment, Like, NestedComment, Investor, BusinessForSale],
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
    // ... your application logic here
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

// Middlewares
app.use(express.json());
app.use(cookieParser());
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
app.use('/api/v1/auth', authRouter);

app.use('/api/v1/post', userPost);

app.use('/businessforsale', BusinessSellerRouter);
// testing api route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Error handlers
app.use(errorHandler());

export { app, AppDataSource, logger };
