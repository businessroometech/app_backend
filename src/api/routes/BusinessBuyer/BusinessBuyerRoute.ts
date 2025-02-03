/* eslint-disable prettier/prettier */

import { Router } from 'express';

import {
  createBusinessBuyer,
  deleteBusinessBuyer,
  getAllBusinessBuyers,
  getBusinessBuyerById,
  updateBusinessBuyer,
} from '../../controllers/BusinessBuyer/BusinessBuyer';

const router = Router();

router.post('/create', createBusinessBuyer);
router.get('/getall', getAllBusinessBuyers);
router.get('/get/:UserId', getBusinessBuyerById);
router.put('/update/:id', updateBusinessBuyer);
router.delete('/delete/:id', deleteBusinessBuyer);

export default router;
