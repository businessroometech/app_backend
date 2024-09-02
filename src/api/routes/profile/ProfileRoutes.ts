import express from 'express';

import { getUser, getPersonalDetails, getEducationalDetails, getFinancialDetails, getProfessionalDetails, setPersonalDetails, setProfessionalDetails, setEducationalDetails, setFinancialDetails, getPersonalDetailsCustomer, setPersonalDetailsCustomer, getBusinessDetails, createOrUpdateBusinessDetails } from '../../controllers/profile/Profile';

const Router = express.Router();

Router.post('/me', getUser);

Router.post('/your-personal-details', getPersonalDetails);
Router.post('/your-professional-details', getProfessionalDetails);
Router.post('/your-educational-details/:sectortype', getEducationalDetails);
Router.post('/your-financial-details', getFinancialDetails);
Router.post('/your-business-details', getBusinessDetails);

Router.post('/personal', setPersonalDetails);
Router.post('/professional', setProfessionalDetails);
Router.post('/educational/:sectortype', setEducationalDetails);
Router.post('/financial', setFinancialDetails);
Router.post('/business', createOrUpdateBusinessDetails);

Router.post('/your-personal-details-customer', getPersonalDetailsCustomer);
Router.post('/personal-customer', setPersonalDetailsCustomer);

export default Router;
