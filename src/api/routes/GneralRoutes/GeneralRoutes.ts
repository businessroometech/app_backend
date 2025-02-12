/* eslint-disable prettier/prettier */
import express from 'express';

import { createGeneral, deleteGeneral, getAllGeneral, getGeneralById, UpdateGeneral } from '@/api/controllers/General/GeneralControllers';


const router = express.Router();

//create
router.post('/create', createGeneral);

// Get all 
router.get('/getall', getAllGeneral);

// Get investor by ID
router.get('/get/:UserId', getGeneralById);

// Update  investor by ID
router.put('/update/:UserId', UpdateGeneral);

// Delete investor by ID
router.delete('/delete/:UserId', deleteGeneral);

export default router;
