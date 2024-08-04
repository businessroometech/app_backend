import express from 'express';

import {
    getYourServices,
    addService,
    acceptService,
    rejectService
} from '@/api/controllers/orderManagement/Service';

const Router = express.Router();

Router.post('/service-provider/get-your-service', getYourServices);
Router.post('/service-provider/add-service', addService);
Router.post('/service-provider/accept-service', acceptService);
Router.post('/service-provider/reject-service', rejectService);

export default Router;
