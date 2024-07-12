import express from 'express';

import { getRoles } from '@/api/controllers/roles/RolesController';

const Router = express.Router();

Router.post('/sector-wise', getRoles);

export default Router;
