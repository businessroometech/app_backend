/* eslint-disable prettier/prettier */

import { Router } from 'express';

import {
    createBusinessForSale,
    deleteBusinessForSale,
    getAllBusinessesForSale,
    getBusinessForSaleById,
getBusinessForSaleByUniqueId,    updateBusinessForSale } from '../../controllers/BuisnessSeller/BuisnessSeller';

const router = Router();


router.post('/create', createBusinessForSale);


router.get('/getall', getAllBusinessesForSale);


router.get('/detail/:UserId', getBusinessForSaleById);


router.put('/update/:id', updateBusinessForSale);


router.delete('/delete/:id', deleteBusinessForSale);

router.get('/detailuuid/:id' , getBusinessForSaleByUniqueId)


export default router;
