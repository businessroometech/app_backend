/* eslint-disable prettier/prettier */

import { Router } from 'express';

import { createEntrepreneur, deleteEntrepreneur,getAllEntrepreneurs, getEntrepreneurById, UpdateEntrepreneur, updateEntrepreneur, UpdateInvestor } from '../../controllers/entrepreneur/EntrepreneurProfile';

const entrepreneurRouter = Router();

//  to create a new entrepreneur
entrepreneurRouter.post('/create', createEntrepreneur);

// get all entrepreneurs
entrepreneurRouter.get('/getall', getAllEntrepreneurs);

// Route to get an entrepreneur detail by ID
entrepreneurRouter.get('/detail/:UserId', getEntrepreneurById);

// Route to update 
entrepreneurRouter.put('/update/:UserId', UpdateEntrepreneur);

//  delete an entrepreneur 
entrepreneurRouter.delete('/delete/:UserId', deleteEntrepreneur);

export default entrepreneurRouter;
