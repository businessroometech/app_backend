/* eslint-disable prettier/prettier */

import { Router } from 'express';

import {
    createBusinessForSale,
    deleteBusinessForSale,
    getAllBusinessesForSale,
    getBusinessForSaleById,
    updateBusinessForSale} from '../../controllers/BuisnessSeller/BuisnessSeller';

const router = Router();


router.post('/create', createBusinessForSale);


router.get('/getall', getAllBusinessesForSale);


router.get('/detai;/:id', getBusinessForSaleById);


router.put('/update/:id', updateBusinessForSale);


router.delete('/delete/:id', deleteBusinessForSale);

export default router;
