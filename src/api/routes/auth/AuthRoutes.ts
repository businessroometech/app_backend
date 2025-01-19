import express from 'express';

import { login } from '../../controllers/auth/Login';
import { logout } from '../../controllers/auth/Logout';
import { signup } from '../../controllers/auth/Signup';
import { authenticate } from '../../middlewares/auth/Authenticate';
import { generateUploadUrl, getDocumentFromBucket } from "../../controllers/s3/awsControllers";
import {  getUserProfile, UpdateUserProfile } from '@/api/controllers/profile/UserProfile';
import { sendResetEmail, resetPassword } from "@/api/controllers/auth/ResetPassword";
import { sendVerificationEmail, verifyEmail } from '@/api/controllers/auth/EmailVerification';

const Router = express.Router();    

Router.post('/signup', signup);
Router.post('/login', login);
Router.post('/logout', authenticate, logout);
Router.post('/reset-pass-req', sendResetEmail);
Router.post('/reset-pass', resetPassword);

Router.post('/send-verify-email', sendVerificationEmail);
Router.post('/verify-email', verifyEmail);



Router.post('/generate-upload-url', generateUploadUrl);
Router.post('/document-retrival', getDocumentFromBucket);

Router.post('/update-or-create-Profile', UpdateUserProfile)
Router.post('/get-user-Profile', getUserProfile)

export default Router;

