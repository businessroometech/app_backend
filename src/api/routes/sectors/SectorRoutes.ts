import express from 'express';

import { getAllSectors, getSector } from '@/api/controllers/sectors/SectorController';

const Router = express.Router();

Router.post('', getAllSectors)
Router.post('/me', getSector);

export default Router;
