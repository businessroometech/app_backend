import express from 'express';

import { sendVerificationCode, verifyCode } from '../../controllers/auth/ContactVerifications';
import { login, generateUuidToken, verifyUuidToken, protectedRoute, refresh } from '../../controllers/auth/Login';
import { logout } from '../../controllers/auth/Logout';
import {
  changePassword,
  resetPassword,
  sendNumberVerificationToken,
  verifyCodeForPasswordReset,
} from '../../controllers/auth/ResetPassword';
import { signup } from '../../controllers/auth/Signup';
import { generateUploadUrl, addDocumentUpload, getDocumentFromBucket } from '../../controllers/awsFuctions/AwsFunctions';
import { authenticate } from '../../middlewares/auth/Authenticate';

const Router = express.Router();

Router.post('/verification/generate', sendVerificationCode);
Router.post('/verification/verify', verifyCode);

Router.post('/signup', signup);

Router.post('/login', login);
Router.post('/generate-login-token', generateUuidToken);
Router.post('/verify-login-token', verifyUuidToken);
Router.post('/logout', logout);

Router.post('/refresh', refresh);
Router.get('/protected', authenticate, protectedRoute);

Router.post('/generate-upload-url', generateUploadUrl);
Router.post('/document-retrival', getDocumentFromBucket);
Router.post('/list-uploaded-document', addDocumentUpload);

Router.post('/forgot-password/generate', sendNumberVerificationToken);
Router.post('/forgot-password/verify', verifyCodeForPasswordReset);
Router.post('/forgot-password/reset', resetPassword);

Router.post('/change-password', changePassword);
export default Router;
