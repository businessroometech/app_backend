import express from 'express';

import { login } from '../../controllers/auth/Login';
import { logout } from '../../controllers/auth/Logout';
import { signup } from '../../controllers/auth/Signup';
import { authenticate } from '../../middlewares/auth/Authenticate';
import { generateUploadUrl, getDocumentFromBucket } from "../../controllers/s3/awsControllers";

const Router = express.Router();

Router.post('/signup', signup);
Router.post('/login', login);
Router.post('/logout', authenticate, logout);

Router.post('/generate-upload-url', generateUploadUrl);
Router.post('/document-retrival', getDocumentFromBucket);

export default Router;

