import express from 'express';

import {
  getEducationalDetails,
  getPersonalDetails,
  getProfessionalDetails,
  // getUserDetails,
} from '@/api/controllers/users/UserController';

const Router = express.Router();

// Router.post('/user-details', getUserDetails);
Router.post('/personal-details', getPersonalDetails);
Router.post('/professional-details', getProfessionalDetails);
Router.post('/educational-details', getEducationalDetails);

export default Router;
