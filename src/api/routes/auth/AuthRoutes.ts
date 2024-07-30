import express from 'express';

import { sendVerificationCode, verifyCode } from '../../controllers/auth/ContactVerifications';
import { login, protectedRoute, refresh } from '../../controllers/auth/Login';
import { logout } from '../../controllers/auth/Logout';
import {
  changePassword,
  resetPassword,
  sendNumberVerificationToken,
  verifyCodeForPasswordReset,
} from '../../controllers/auth/ResetPassword';
import {
  signup_phase1,
  signup_phase2,
  signup_phase3,
  signup_phase4,
  signup_phase5,
} from '../../controllers/auth/Signup';
import { generateUploadUrl, addDocumentUpload } from '../../controllers/awsFuctions/GenerateUploadUrl';
import { authenticate } from '../../middlewares/auth/Authenticate';

const Router = express.Router();

Router.post('/contact-verification/generate', sendVerificationCode);
Router.post('/contact-verification/verify', verifyCode);

Router.post('/signup_phase1', signup_phase1);
Router.post('/signup_phase2', signup_phase2);
Router.post('/signup_phase3', signup_phase3);
Router.post('/signup_phase4', signup_phase4);
Router.post('/signup_phase5/:sectortype', signup_phase5);

Router.post('/login', login);
Router.post('/logout', logout);

Router.post('/refresh', refresh);
Router.get('/protected', authenticate, protectedRoute);

Router.post('/generate-upload-url', generateUploadUrl);
Router.post('/document-upload', addDocumentUpload);

Router.post('/forgot-password/generate', sendNumberVerificationToken);
Router.post('/forgot-password/verify', verifyCodeForPasswordReset);
Router.post('/forgot-password/reset', resetPassword);

Router.post('/change-password', changePassword);
export default Router;
