import { Router } from 'express';

import { authenticate } from '@/api/middlewares/auth/Authenticate';

import {
  createOrUpdateInvestorData,
  getInvestorData,
  deleteInvestorData
} from '../../controllers/business-data/InvestorData';


const router = Router();

router.post('/investor-data', authenticate, createOrUpdateInvestorData);
router.get('/investor-data', authenticate, getInvestorData);
router.delete('/investor-data/:investorId', authenticate, deleteInvestorData);

export default router;
