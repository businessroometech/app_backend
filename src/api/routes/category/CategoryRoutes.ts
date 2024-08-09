import express from 'express';

import { getCategories } from '@/api/controllers/category/CategoryController';

const Router = express.Router();

Router.post('/sector-wise', getCategories);

export default Router;
