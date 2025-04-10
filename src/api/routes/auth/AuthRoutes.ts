import express from 'express';

import { disable, deleteUser, blockUser, farmaan, login } from '../../controllers/auth/Login';
import { logout } from '../../controllers/auth/Logout';
import { signup } from '../../controllers/auth/Signup';
import { authenticate } from '../../middlewares/auth/Authenticate';
import { generateUploadUrl, getDocumentFromBucket } from '../../controllers/s3/awsControllers';
import {
  findUserByUserName,
  getUserProfile,
  ProfileVisitController,
  searchUserProfile,
  UpdateUserProfile,
  uploadProfileAndCover,
} from '@/api/controllers/profile/UserProfile';
import { sendResetEmail, resetPassword } from '@/api/controllers/auth/ResetPassword';
import { getOnlineUsers } from '@/api/controllers/chat/Message';
import { sendVerificationEmail, verifyEmail } from '@/api/controllers/auth/EmailVerification';
import { getInTouch, createAccount, transfer } from '@/api/controllers/LandingPage/LandingPage';
// import { uploadMiddleware2 } from '@/api/controllers/posts/UserPost';
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

Router.post('/update-or-create-Profile', authenticate, uploadProfileAndCover, UpdateUserProfile);
Router.get('/get-user-Profile', authenticate, getUserProfile);

Router.post('/recored-visit', authenticate, ProfileVisitController.recordVisit);
Router.get('/get-profile-visit', authenticate, ProfileVisitController.getMyProfileVisits);
Router.get('/get-profile-visited', authenticate, ProfileVisitController.getProfilesIVisited);

Router.post('/online-users', getOnlineUsers);
Router.get('/users', authenticate, searchUserProfile);
Router.post('/get-user-userName', findUserByUserName);

Router.post('/get-in-touch', getInTouch);
Router.post('/create-account', createAccount);
Router.post('/migration/connect-to-account', transfer);

Router.post('/disable-me', authenticate, disable);
Router.post('/delete-me', authenticate, deleteUser);
Router.post('/block-user', authenticate, blockUser);

Router.post('/farmaan-bhejdo', farmaan);

export default Router;
