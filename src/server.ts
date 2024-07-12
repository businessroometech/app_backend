import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { createConnection } from 'typeorm';

import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';
import { env } from '@/common/utils/envConfig';

// import { openAPIRouter } from '@/api-docs/openAPIRouter';
import authRouter from '../src/api/routes/auth/AuthRoutes';
import sectorsRouter from '../src/api/routes/sectors/SectorRoutes';
import rolesRouter from './api/routes/roles/RoleRoutes';
import usersRouter from './api/routes/users/UserRoutes';

const logger = pino({ name: 'server start' });
const app: Express = express();

createConnection()
  .then(() => {
    console.log('DB connnected');
  })
  .catch((error) => {
    console.log(error);
  });

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes mounting
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/sectors', sectorsRouter);
app.use('/api/v1/roles', rolesRouter);
app.use('/api/v1/users', usersRouter);
// app.use('/health-check', healthCheckRouter);

// Swagger UI
// app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
