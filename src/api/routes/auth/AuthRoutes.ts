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
import { signup } from '../../controllers/auth/Signup';
import { generateUploadUrl, addDocumentUpload } from '../../controllers/awsFuctions/GenerateUploadUrl';
import { authenticate } from '../../middlewares/auth/Authenticate';

const Router = express.Router();

Router.post('/contact-verification/generate', sendVerificationCode);
Router.post('/contact-verification/verify', verifyCode);

Router.post('/signup', signup);

Router.post('/login', login);
Router.post('/logout', logout);

Router.post('/refresh', refresh);
Router.get('/protected', authenticate, protectedRoute);

Router.post('/generate-upload-url', generateUploadUrl);
Router.post('/list-uploaded-document', addDocumentUpload);

Router.post('/forgot-password/generate', sendNumberVerificationToken);
Router.post('/forgot-password/verify', verifyCodeForPasswordReset);
Router.post('/forgot-password/reset', resetPassword);

Router.post('/change-password', changePassword);
export default Router;
