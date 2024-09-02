import express from 'express';

import {
    getYourServices,
    // addService,
    acceptService,
    rejectService,
    completeService,

    addOrUpdateProvidedService,
    getProvidedService,
    deleteProvidedService
} from '@/api/controllers/orderManagement/ServiceProvider';

const Router = express.Router();

Router.post('/', getYourServices);
// Router.post('/service-provider/add-service', addService);
Router.post('/accept', acceptService);
Router.post('/reject', rejectService);
Router.post('/complete', completeService);

Router.post('/service-management/get', getProvidedService);
Router.post('/service-management/add-or-update', addOrUpdateProvidedService);
Router.delete('/service-management', deleteProvidedService);

export default Router;
