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
import sectorsRouter from '../src/api/routes/sectors/SectorRoutes';
import CategoriesRouter from './api/routes/category/CategoryRoutes';
import profileRouter from './api/routes/profile/ProfileRoutes';
import customerRouter from './api/routes/orderManagement/CustomerRoutes';
import serviceProviderRouter from './api/routes/orderManagement/ServiceProviderRoutes';
import paymentRouter from "./api/routes/payment/PaymentRoutes";
import notificationRouter from "./api/routes/notifications/NotificationRoutes";
import eventRouter from './api/routes/events/eventsRoutes'
import invoiceRouter from "./api/routes/invoice/InvoiceRoutes";


const logger = pino({ name: 'server start' });
const app: Express = express();

import { DataSource } from 'typeorm'; // Import DataSource/ Import your environment variables
import { ServiceJob } from './api/entity/orderManagement/serviceProvider/serviceJob/ServiceJob';
import { OrderItemBooking } from './api/entity/orderManagement/customer/OrderItemBooking';
import { ProvidedService } from './api/entity/orderManagement/serviceProvider/service/ProvidedService';
import { SubCategory } from './api/entity/sector/SubCategory';
import { Category } from './api/entity/sector/Category';
import { Sector } from './api/entity/sector/Sector';
import { UserLogin } from './api/entity/user/UserLogin';
import { Service } from './api/entity/sector/Service';
import { Order } from './api/entity/orderManagement/customer/Order';
import { OrderItemProduct } from './api/entity/orderManagement/customer/OrderItemProduct';
import { Cart } from './api/entity/orderManagement/customer/Cart';
import { CartItemBooking } from './api/entity/orderManagement/customer/CartItemBooking';
import { CartItemProduct } from './api/entity/orderManagement/customer/CartItemProduct';
import { Token } from './api/entity/others/Token';
import { PersonalDetails } from './api/entity/profile/personal/PersonalDetails';
import { PersonalDetailsCustomer } from './api/entity/profile/personal/PersonalDetailsCustomer';
import { FinancialDetails } from './api/entity/profile/financial/FinancialDetails';
import { EducationalDetails } from './api/entity/profile/educational/other/EducationalDetails';
import { BusinessDetails } from './api/entity/profile/business/BusinessDetails';
import { OtpVerification } from './api/entity/others/OtpVerification';
import { PasswordResetToken } from './api/entity/others/PasswordResetToken';
import { RefreshToken } from './api/entity/others/RefreshToken';
import { ProvidedProduct } from './api/entity/orderManagement/serviceProvider/product/ProvidedProduct';
import { DocumentUpload } from './api/entity/profile/DocumentUpload';
import { UserAddress } from './api/entity/user/UserAddress';
import { RescheduledBooking } from './api/entity/orderManagement/customer/RescheduledBooking';
import { Transaction } from './api/entity/payment/Transaction';
import { Notification } from './api/entity/notifications/Notification';
import { Template } from './api/entity/notifications/Template';
import { DeliveryLog } from './api/entity/notifications/DeliveryLog';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from '../swagger_output.json';
import { Invoice } from './api/entity/others/Invoice';
import { Event } from './api/entity/eventManagement/Event';
import { DressCode } from './api/entity/eventManagement/DressCode';
import { BankDetails } from './api/entity/eventManagement/BankDetails';
import { EventBooking } from './api/entity/eventManagement/EventBooking';
import { EventDraft } from './api/entity/eventManagement/EventDraft';
import { EventMedia } from './api/entity/eventManagement/EventMedia';
import { EventParticipant } from './api/entity/eventManagement/EventParticipant';
import { EventPayment } from './api/entity/eventManagement/EventPayment';
import { EventRule } from './api/entity/eventManagement/EventRule';
import { EventSchedule } from './api/entity/eventManagement/EventSchedule';
import { Ticket } from './api/entity/eventManagement/Ticket';
import { Dropdown } from './api/entity/eventManagement/Dropdown';
import { ServiceJobRescheduled } from './api/entity/orderManagement/serviceProvider/serviceJob/ServiceJobReschedueled';
import { EventOrganiser, SocialMediaLink } from './api/entity/eventManagement/EventOrganiser';
import { SoldTicket } from './api/entity/eventManagement/SoldTicket';

// Create a DataSource instance
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_HOST : process.env.DEV_AWS_HOST,
  port: 3306,
  username: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_USERNAME : process.env.DEV_AWS_USERNAME,
  password: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_PASSWORD : process.env.DEV_AWS_PASSWORD,
  database: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_DB_NAME : process.env.DEV_AWS_DB_NAME,
  entities: [ServiceJob, OrderItemBooking, OrderItemProduct, Cart, CartItemBooking, CartItemProduct, Order, ProvidedService, ProvidedProduct, SubCategory, Category, Sector, Service, UserLogin, Token, PersonalDetails, PersonalDetailsCustomer, FinancialDetails, EducationalDetails, BusinessDetails, OtpVerification, PasswordResetToken, RefreshToken, DocumentUpload, PasswordResetToken, UserAddress, RescheduledBooking, Transaction, Notification, Template, DeliveryLog, Invoice, Event, DressCode, BankDetails, EventBooking, EventDraft, EventMedia, EventParticipant, EventPayment, EventRule, EventSchedule, Ticket, Dropdown, EventOrganiser, SocialMediaLink, SoldTicket],
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
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/event-managment/mobile', eventRouter);
// app.use('/health-check', healthCheckRouter) ;
app.use('/api/v1/invoices', invoiceRouter);
// app.use('/health-check', healthCheckRouter);

// Error handlers
app.use(errorHandler());

export { app, logger, AppDataSource };
