import express from 'express';

import { getPersonalDetails, getEducationalDetails, getFinancialDetails, getProfessionalDetails, setPersonalDetails, setProfessionalDetails, setEducationalDetails, setFinancialDetails } from '../../controllers/profile/Profile';

const Router = express.Router();

Router.post('/personal', getPersonalDetails);
Router.post('/professional', getProfessionalDetails);
Router.post('/educational/:sectortype', getEducationalDetails);
Router.post('/financial', getFinancialDetails);

Router.post('/personal', setPersonalDetails);
Router.post('/professional', setProfessionalDetails);
Router.post('/educational/:sectortype', setEducationalDetails);
Router.post('/financial', setFinancialDetails);

export default Router;
