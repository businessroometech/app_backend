import express from 'express';

import { getPersonalDetails, getEducationalDetails, getFinancialDetails, getProfessionalDetails, setPersonalDetails, setProfessionalDetails, setEducationalDetails, setFinancialDetails } from '../../controllers/profile/Profile';

const Router = express.Router();

Router.post('/your-personal-details', getPersonalDetails);
Router.post('/your-professional-details', getProfessionalDetails);
Router.post('/your-educational-details/:sectortype', getEducationalDetails);
Router.post('/your-financial-details', getFinancialDetails);

Router.post('/personal', setPersonalDetails);
Router.post('/professional', setProfessionalDetails);
Router.post('/educational/:sectortype', setEducationalDetails);
Router.post('/financial', setFinancialDetails);

export default Router;
