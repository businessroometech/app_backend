import express from 'express';

import { getAllSectors, getSector, getAllSubCategories } from '@/api/controllers/sectors/SectorController';

const Router = express.Router();

Router.post('', getAllSectors);
Router.post('/categories/subCategories', getAllSubCategories)
Router.post('/me', getSector);

export default Router;
