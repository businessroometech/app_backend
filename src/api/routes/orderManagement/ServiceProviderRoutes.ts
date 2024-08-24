import express from 'express';

import {
    getYourServices,
    // addService,
    acceptService,
    rejectService,

    addOrUpdateProvidedService,
    getProvidedService,
    deleteProvidedService
} from '@/api/controllers/orderManagement/ServiceProvider';

const Router = express.Router();

Router.get('/', getYourServices);
// Router.post('/service-provider/add-service', addService);
Router.post('/accept', acceptService);
Router.post('/reject', rejectService);

Router.post('/service-management/get', getProvidedService);
Router.post('/service-management/add-or-update', addOrUpdateProvidedService);
Router.delete('/service-management', deleteProvidedService);

export default Router;
