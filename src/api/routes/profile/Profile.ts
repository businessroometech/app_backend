import express from 'express';

import { setPersonalDetails, setProfessionalDetails, setEducationalDetails, setFinancialDetails } from '../../controllers/profile/Profile';

const Router = express.Router();

Router.post('/personal', setPersonalDetails);
Router.post('/professional', setProfessionalDetails);
Router.post('/educational/:sectortype', setEducationalDetails);
Router.post('/financial', setFinancialDetails);

export default Router;
