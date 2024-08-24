import express from 'express';

import { getAllSectors, getSector, getAllSubCategories, getServicesSubCategoryWise } from '@/api/controllers/sectors/SectorController';

const Router = express.Router();

Router.post('', getAllSectors);
Router.post('/categories/subCategories', getAllSubCategories)
Router.post('/me', getSector);
Router.post('/categories/subCategories/services-offered', getServicesSubCategoryWise)

export default Router;
