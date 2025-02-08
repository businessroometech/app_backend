/* eslint-disable prettier/prettier */

import { Router } from 'express';

import {
  createBusinessBuyer,
  deleteBusinessBuyer,
  getAllBusinessBuyers,
  getBusinessBuyerById,
  UpdateBusinessBuyer,
} from '../../controllers/BusinessBuyer/BusinessBuyer';

const router = Router();

router.post('/create', createBusinessBuyer);
router.get('/getall', getAllBusinessBuyers);
router.get('/get/:UserId', getBusinessBuyerById);
router.put('/update/:UserId', UpdateBusinessBuyer);
router.delete('/delete/:UserId', deleteBusinessBuyer);

export default router;
