import { Router } from 'express';

import { authenticate } from '@/api/middlewares/auth/Authenticate';

import {
  createOrUpdateInvestorData,
  getInvestorData,
  deleteInvestorData,
  uploadLogoMiddleware
} from '../../controllers/business-data/BusinessData';
// import { uploadMiddleware } from '@/api/controllers/posts/UserPost';


const router = Router();

router.post('/investor-data', authenticate, uploadLogoMiddleware, createOrUpdateInvestorData);
router.get('/investor-data', authenticate, getInvestorData);
router.delete('/investor-data/:id', authenticate, deleteInvestorData);

export default router;
