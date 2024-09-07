import express from 'express';

import {
    getYourServices,
    // addService,
    acceptService,
    rejectService,
    completeService,

    addOrUpdateProvidedService,
    getProvidedService,
    deleteProvidedService,
    getServiceJobsBy_Year_Month_Week
} from '@/api/controllers/orderManagement/ServiceProvider';
import { authenticate } from '@/api/middlewares/auth/Authenticate';

const Router = express.Router();

Router.post('/', getYourServices);
// Router.post('/service-provider/add-service', addService);
Router.post('/accept', acceptService);
Router.post('/reject', rejectService);
Router.post('/complete', completeService);

Router.post('/service-management/get', authenticate, getProvidedService);
Router.post('/service-management/add-or-update', authenticate, addOrUpdateProvidedService);
Router.delete('/service-management', authenticate, deleteProvidedService);

// home
Router.post('/by_year_month_week', getServiceJobsBy_Year_Month_Week);

export default Router;
