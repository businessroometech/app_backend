import express from 'express';

import {
    getYourServices,
    // addService,
    acceptService,
    rejectService
} from '@/api/controllers/orderManagement/Service';

const Router = express.Router();

Router.post('/service-provider', getYourServices);
// Router.post('/service-provider/add-service', addService);
Router.post('/service-provider/accept', acceptService);
Router.post('/service-provider/reject', rejectService);

export default Router;
