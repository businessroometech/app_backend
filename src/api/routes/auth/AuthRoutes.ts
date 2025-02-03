import express from 'express';

import { login } from '../../controllers/auth/Login';
import { logout } from '../../controllers/auth/Logout';
import { signup } from '../../controllers/auth/Signup';
import { authenticate } from '../../middlewares/auth/Authenticate';
import { generateUploadUrl, getDocumentFromBucket } from "../../controllers/s3/awsControllers";
import { findUserByUserName, getUserProfile, ProfileVisitController, searchUserProfile, UpdateUserProfile } from '@/api/controllers/profile/UserProfile';
import { sendResetEmail, resetPassword } from "@/api/controllers/auth/ResetPassword";
import { getOnlineUsers } from '@/api/controllers/chat/Message';
import { sendVerificationEmail, verifyEmail } from '@/api/controllers/auth/EmailVerification';
// import { getOnlineUsers } from "../../../socket";
// import { sendVerificationEmail, verifyEmail } from '@/api/controllers/auth/EmailVerification';

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


Router.post('/recored-visit', ProfileVisitController.recordVisit)
Router.post('/get-profile-visit', ProfileVisitController.getMyProfileVisits)
Router.post('/get-profile-visited', ProfileVisitController.getProfilesIVisited)

Router.post('/online-users', getOnlineUsers);
Router.post('/get-users', searchUserProfile);
Router.post('/get-user-userName', findUserByUserName);

export default Router;

