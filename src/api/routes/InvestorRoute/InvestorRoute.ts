/* eslint-disable prettier/prettier */
import express from 'express';

import { createInvestor, deleteInvestor,getAllInvestors, getInvestorById, updateInvestor } from '../../controllers/Investor/InvestorProfile';

const router = express.Router();

//create
router.post('/investors/create', createInvestor);

// Get all 
router.get('/investors/getall', getAllInvestors);

// Get investor by ID
router.get('/investors/:id', getInvestorById);

// Update  investor by ID
router.put('/investors/update/:id', updateInvestor);

// Delete investor by ID
router.delete('/investors/delete/:id', deleteInvestor);

export default router;
