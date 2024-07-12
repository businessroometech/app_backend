import express from 'express';

import { getSector } from '@/api/controllers/sectors/SectorController';

const Router = express.Router();

Router.post('/me', getSector);

export default Router;
