/* eslint-disable prettier/prettier */
import express from 'express';

import { createInvestor, deleteInvestor,getAllInvestors, getInvestorById, updateInvestor } from '../../controllers/Investor/InvestorProfile';

const router = express.Router();

//create
router.post('/create', createInvestor);

// Get all 
router.get('/getall', getAllInvestors);

// Get investor by ID
router.get('/get/:UserId', getInvestorById);

// Update  investor by ID
router.put('/update/:id', updateInvestor);

// Delete investor by ID
router.delete('/delete/:id', deleteInvestor);

export default router;
