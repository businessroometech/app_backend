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

    getServiceJobsBy_Year_Month_Week,
    totalAmountBy_Year_Month_Week,
    getAvgPricePerMonthForCurrentYear,
    compareAvgPriceWithPreviousMonth,
    totalSalesSubCategoryWise
} from '@/api/controllers/orderManagement/ServiceProvider';
import { authenticate } from '@/api/middlewares/auth/Authenticate';

const Router = express.Router();

Router.post('/', authenticate, getYourServices);
// Router.post('/service-provider/add-service', addService);
Router.post('/accept', authenticate, acceptService);
Router.post('/reject', authenticate, rejectService);
Router.post('/complete', authenticate, completeService);

Router.post('/service-management/get', authenticate, getProvidedService);
Router.post('/service-management/add-or-update', authenticate, addOrUpdateProvidedService);
Router.delete('/service-management', authenticate, deleteProvidedService);

// home
Router.post('/by_year_month_week', getServiceJobsBy_Year_Month_Week);
Router.post('/sales/overview/by_year_month_week', totalAmountBy_Year_Month_Week);
Router.post('/sales/by_subCategories/by_year_month_week', totalSalesSubCategoryWise);
Router.post('/avg_order_price_yearly', getAvgPricePerMonthForCurrentYear);
Router.post('/compare_avg_order_price_monthly', compareAvgPriceWithPreviousMonth);

export default Router;
