import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';
import { env } from '@/common/utils/envConfig';
import 'reflect-metadata';

import authRouter from '../src/api/routes/auth/AuthRoutes';
import sectorsRouter from '../src/api/routes/sectors/SectorRoutes';
import CategoriesRouter from './api/routes/category/CategoryRoutes';
import profileRouter from './api/routes/profile/ProfileRoutes';
import customerRouter from './api/routes/orderManagement/CustomerRoutes';
import serviceProviderRouter from './api/routes/orderManagement/ServiceProviderRoutes';
import paymentRouter from "./api/routes/payment/PaymentRoutes";
import { authenticate } from './api/middlewares/auth/Authenticate';
import path from 'path';

const logger = pino({ name: 'server start' });
const app: Express = express();

import { DataSource } from 'typeorm'; // Import DataSource/ Import your environment variables
import { UserLogin } from './api/entity/user/UserLogin';
// import { AppDataSource } from './ormconfig';
console.log(path.join(__dirname, process.env.NODE_ENV === 'production' ? '/api/entity/*.js' : '/entity/*.ts'));
console.log('env',  process.env.NODE_ENV);
// Create a DataSource instance
 const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_HOST : process.env.DEV_AWS_HOST,
  port: 3306,
  username: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_USERNAME : process.env.DEV_AWS_USERNAME,
  password: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_PASSWORD : process.env.DEV_AWS_PASSWORD,
  database: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_DB_NAME : process.env.DEV_AWS_DB_NAME,
  synchronize: true,
  logging: false,
  entities: [
    path.join(__dirname, process.env.NODE_ENV === 'production' ? '/api/entity/*.js' : '/api/entity/**/*.ts'),
  ],
  migrations: [
    path.join(__dirname, process.env.NODE_ENV === 'production' ? '/migration/*.js' : '/migration/**/*.js')
  ],
  subscribers: [
    path.join(__dirname, process.env.NODE_ENV === 'production' ? '/subscriber/*.js' : '/subscriber/**/*.js')
  ],
  // entities: ['src/api/entity/*.ts'], // Path to your entities
  // migrations: ['src/migration/*.ts'], // Path to your migrations
  // subscribers: ['src/subscriber/*.ts'], // Path to your subscribers
});

console.log('AppDataSource',AppDataSource)

const myArray = AppDataSource.options.entities;
const myArray2 = AppDataSource.options.migrations;

// Iterate and print
console.log('test,',myArray)
console.log('test,',myArray2)
// Initialize the DataSource
AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!");
    // Start your Express server or other initialization code

      // Using QueryBuilder to fetch users
    // Using raw SQL to select all users
    // const users = await AppDataSource.query('SELECT * FROM UserLogin'); // Adjust the table name as needed

    // console.log('All Users:', users);
    // console.log('Users:', users);
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

// Middlewares
app.use(express.json());
app.use(cookieParser());
// app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // Allow all origins
  },
  credentials: true,
}));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes mounting
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/sectors', sectorsRouter);
app.use('/api/v1/categories', CategoriesRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/order-management/customer', customerRouter);
app.use('/api/v1/order-management/service-provider', serviceProviderRouter);
app.use('/api/v1/checkout', paymentRouter);
// app.use('/health-check', healthCheckRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
